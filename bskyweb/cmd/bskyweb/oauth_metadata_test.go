package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/labstack/echo/v4"
)

func TestOAuthMetadata(t *testing.T) {
	for _, native := range []bool{false, true} {
		audience := "did:web:blacksky.app#bsky_appview"
		filename := "/oauth-client-metadata.json"
		if native {
			filename = "/oauth-client-metadata-native.json"
		}
		target := "https://dev.tenna.party" + filename + "?appview=" + url.QueryEscape(audience)
		req := httptest.NewRequest(http.MethodGet, target, nil)
		rec := httptest.NewRecorder()
		ctx := echo.New().NewContext(req, rec)
		if err := (&Server{}).oauthClientMetadata(ctx, native); err != nil {
			t.Fatal(err)
		}
		var metadata struct {
			ClientID  string   `json:"client_id"`
			Scope     string   `json:"scope"`
			Redirects []string `json:"redirect_uris"`
		}
		if err := json.Unmarshal(rec.Body.Bytes(), &metadata); err != nil {
			t.Fatal(err)
		}
		if metadata.ClientID != target {
			t.Fatalf("wrong client ID: %s", metadata.ClientID)
		}
		if !strings.Contains(metadata.Scope, "include:party.tenna.app.permissions2?aud="+url.QueryEscape(audience)) {
			t.Fatal("missing selected audience")
		}
		for _, method := range []string{"app.bsky.actor.getPreferences", "app.bsky.actor.putPreferences"} {
			if !strings.Contains(metadata.Scope, "rpc:"+method+"?aud="+url.QueryEscape("did:web:api.bsky.app#bsky_appview")) {
				t.Fatal("missing PDS preference audience")
			}
		}
		if strings.Contains(metadata.Scope, "transition:") {
			t.Fatal("legacy scopes remain")
		}
		redirect := "https://dev.tenna.party/auth/web/callback"
		if native {
			redirect = "party.tenna:/auth/callback"
		}
		expectedCount := 1
		if native { expectedCount = 2 }
		if len(metadata.Redirects) != expectedCount || metadata.Redirects[0] != redirect {
			t.Fatal("incorrect redirect")
		}
	}
}

func TestOAuthMetadataRejectsInvalidAudience(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "https://tenna.party/oauth-client-metadata.json?appview=*", nil)
	ctx := echo.New().NewContext(req, httptest.NewRecorder())
	err := (&Server{}).OAuthClientMetadata(ctx)
	if httpErr, ok := err.(*echo.HTTPError); !ok || httpErr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %v", err)
	}
}
