# Unblocking GitHub Push (Mapbox Token in Diff)

## The Loop

GitHub blocks pushes when it detects secrets. Even though we **removed** the token from the code, the git **diff** still shows the old content (with the token) in the "removed" lines. Push protection scans the entire push payload, including diffs, so it blocks.

## Steps to Unblock

### 1. Allow the secret (one-time)

Click the link GitHub provided in the push error:

```
https://github.com/eliteweblabs/capco/security/secret-scanning/unblock-secret/39dXDGdRITnxjwfedqP5qHBbIk6
```

This lets you push. You may need repo admin or org security permissions.

### 2. Push again

```bash
git push
```

### 3. Rotate the Mapbox token immediately

The token was committed before, so it's in the repo history. Even after removing it, it's still exposed.

1. Go to [Mapbox Account → Access Tokens](https://account.mapbox.com/access-tokens/)
2. Create a **new** token
3. Revoke/delete the old token (see your Mapbox account for the exposed token)
4. Update your `.env` with the new token

### 4. (Optional) Purge from git history

To fully remove the token from history, use `git filter-repo` or BFG:

```bash
# Requires git-filter-repo: pip install git-filter-repo
# Create replacements.txt with one line: <FULL_TOKEN>==>REDACTED
git filter-repo --replace-text replacements.txt
git push --force
```

**Warning**: Force push rewrites history. Coordinate with your team first.
