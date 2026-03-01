# Boardshort Photography — Task List

## In Progress
- [ ] Build BS Video Batch Shortcut

## Shortcuts / Workflow
- [ ] Build main Boardshorts launcher Shortcut (calls Image, Video, Publish sub-Shortcuts)
- [ ] Build BS Publish Shortcut (merge draft → main)
- [ ] Move GitHubToken into main Boardshorts Shortcut, pass as input to sub-Shortcuts

## build.js
- [ ] Rewrite for sidecar approach — glob content/days/*.json, assemble day pages, derive sunrise/sunset from time field
- [ ] Enable build caching in Netlify

## Site / CMS
- [ ] Verify hero cycling still works after sidecar switch
- [ ] Test full pipeline end to end — upload → merge → Netlify build → live site

## Future
- [ ] Weather data integration (currently empty string in sidecar)
- [ ] Print fulfillment Shortcut (uses original field to find HEIC in iCloud)
- [ ] Bulk archive loading workflow
