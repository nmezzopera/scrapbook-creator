# Firebase Storage Policy

## PDF Auto-Deletion

### Overview
Generated PDFs are automatically deleted after **24 hours** to manage storage costs and maintain data hygiene.

### Configuration
- **Location**: Firebase Storage bucket `relationship-scrapbook.firebasestorage.app`
- **Lifecycle Rule**: Delete objects in `pdfs/` folder after 1 day
- **Applied**: Using Google Cloud Storage lifecycle management

### Why 24 Hours?
1. **Cost Management**: Each PDF is ~70-80 MB with many images
2. **User Convenience**: Users have 24 hours to re-download if needed
3. **Security**: Automatic cleanup of personal content
4. **Regeneration**: Users can always regenerate PDFs from their scrapbooks

### Current Configuration
```json
{
  "lifecycle": {
    "rule": [
      {
        "action": {
          "type": "Delete"
        },
        "condition": {
          "age": 1,
          "matchesPrefix": ["pdfs/"]
        }
      }
    ]
  }
}
```

### How to Modify
To change the retention period:

```bash
# Create lifecycle config file with desired age (in days)
# Then apply it:
gcloud storage buckets update gs://relationship-scrapbook.firebasestorage.app --lifecycle-file=storage-lifecycle.json
```

### Verify Current Policy
```bash
gcloud storage buckets describe gs://relationship-scrapbook.firebasestorage.app --format="yaml(lifecycle_config)"
```

### User Experience
- Signed URLs expire after **1 hour** (immediate download security)
- PDFs remain in Storage for **24 hours** (re-download window)
- After 24 hours, users can regenerate PDFs anytime from their scrapbook

### Storage Structure
```
pdfs/
├── {userId}/
│   ├── scrapbook-{timestamp1}.pdf  (auto-deleted after 24h)
│   ├── scrapbook-{timestamp2}.pdf  (auto-deleted after 24h)
│   └── ...
```

### Monitoring
Check Storage usage in Firebase Console:
https://console.firebase.google.com/project/relationship-scrapbook/storage
