#!/bin/bash
set -euo pipefail

EMAIL="${1:-test+$(date +%s)@example.com}"
BASE_URL="${BASE_URL:-:3000}"

# 1. Create a user and extract id from response
USER_ID=$(http --check-status POST "$BASE_URL/users" email="$EMAIL" | jq -r '.id')
echo "Created user: $USER_ID ($EMAIL)"

# 2. Get the user by id
http GET "$BASE_URL/users/$USER_ID"

# 3. Start OAuth flow for Spotify and extract the authorization URL
AUTH_URL=$(http --check-status GET "$BASE_URL/auth/spotify/start" userId=="$USER_ID" | jq -r '.authUrl')
echo
echo "Open this URL in a browser to authorize Spotify:"
echo "  $AUTH_URL"
echo

while true; do
	read -r -p "Have you completed the OAuth flow? [y]: " answer
	if [[ "$answer" == "y" ]]; then
		break
	fi
	echo "Waiting — type 'y' and press Enter once you've completed authorization."
done

# 4. List the user's Spotify playlists
http GET "$BASE_URL/users/$USER_ID/playlists/spotify"
