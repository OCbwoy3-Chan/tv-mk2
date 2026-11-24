# expo-media-library

## Android: video albums belong under Movies

Routes video albums to `Environment.DIRECTORY_MOVIES` in
`MimeType.albumRootDirectory()`. Upstream puts both image and video albums
under Pictures. Image albums continue using Pictures, and assets saved without
an album continue using DCIM.

Witchsky creates download albums from each local file (`Album.create(name,
[uri])`) instead of looking up an album by name. This lets the file's MIME type
select `Pictures/Witchsky` or `Movies/Witchsky` without confusing two albums
that share the name Witchsky. Creating from file paths reuses an existing
directory and inserts a new asset without moving previously saved media.
Existing downloads are not migrated.

Android-only, and expo-media-library ships a prebuilt Android AAR, so it must
stay in `expo.autolinking.android.buildFromSource` for this patch to take
effect.
