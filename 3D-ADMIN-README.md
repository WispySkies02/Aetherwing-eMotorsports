# Aetherwing Main Site v2.0.44 — 3D Viewer Admin

Deploy this main-site ZIP to **aetherwing.net** with Paint Booth v88 (deployed separately).

## What changed
- Aetherwing Admin > **3D Viewer** now lists all 40 paint records (35 original plus 5 existing beta test schemes, aligned between the deployments).
- Filter status: 3D ready, PNG required, compatible geometry missing. Upload a flat PNG per scheme and select its **actual 3D body**, separate from visual brand logos. A ready badge only confirms that the body and texture are assigned; verify alignment in the public 3D viewer.
- 3D settings save as published paint overrides in the existing Netlify Blobs paint registry. Normal Paint Editor saves preserve those settings.
- PNG transfers are chunked (512 KiB raw chunks); maximum 16 MiB per PNG. The texture delivery function uses a streaming binary Response (not Base64) to avoid Netlify’s 6 MB buffered-response limit and stay below its 20 MB stream cap. Files larger than 16 MiB need an optimized source PNG or a separate larger-file delivery architecture.
- Uploaded source PNGs are stored in Netlify Blobs and served through /api/paint-3d-texture/:hash.png with CORS for the separate Paint Booth. Historical static 2D renders remain unchanged.
- UARL late models, iRacing vehicles, and the archived D2 Supra are marked as needing distinct geometry, not incorrectly marked texture-only failures.
- Deploy main and booth separately. Main-site deploy does not replace Paint Booth.

## Testing after deployment
1. Sign in to aetherwing.net/admin and open 3D Viewer.
2. Pick one NRRS Toyota paint with status PNG REQUIRED, upload its original paint template, then save.
3. Refresh Admin. Confirm 3D READY; if uploading failed, it must remain pending.
4. Open paint.aetherwing.net and find the scheme in its lower rack. Confirm 3D stage loads and displays the proper texture.
5. Check another paint is not accidentally showing the previous scheme's texture.
6. Check normal Paint Editor changes do not clear the 3D assignment.

**Verification:** Built-in validator and JavaScript syntax checks passed. Production Netlify Blob uploads and live 3D WebGL couldn't be end-to-end tested in this container; do the steps above before considering this fully deployed.
