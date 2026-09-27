package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
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
		target := "https://canary.witchsky.app" + filename + "?appview=" + url.QueryEscape(audience)
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
		if metadata.ClientID != "https://canary.witchsky.app"+filename {
			t.Fatalf("wrong client ID: %s", metadata.ClientID)
		}
		if metadata.Scope != "atproto transition:generic transition:email transition:chat.bsky" {
			t.Fatal("production scopes changed")
		}
		redirect := "https://canary.witchsky.app/auth/web/callback"
		if native {
			redirect = "app.witchsky:/auth/callback"
		}
		if len(metadata.Redirects) != 1 || metadata.Redirects[0] != redirect {
			t.Fatal("incorrect redirect")
		}
	}
}

func TestOAuthMetadataRejectsInvalidAudience(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "https://witchsky.app/oauth-client-metadata.json?appview=*", nil)
	ctx := echo.New().NewContext(req, httptest.NewRecorder())
	err := (&Server{}).OAuthClientMetadata(ctx)
	if httpErr, ok := err.(*echo.HTTPError); !ok || httpErr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %v", err)
	}
}
