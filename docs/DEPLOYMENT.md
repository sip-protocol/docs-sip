# Deployment Runbook

**Project:** SIP Protocol Documentation (docs-sip)
**Last Updated:** 2025-12-04
**Owner:** SIP Protocol Team

---

## Overview

This runbook covers deployment procedures for the SIP Protocol documentation site (docs.sip-protocol.org). The site is built with Astro + Starlight and deployed to a VPS using Docker containers and GitHub Actions for CI/CD.

**Deployment Architecture:**
```
GitHub Push → GitHub Actions → Build Docker Image → Push to GHCR → VPS Pull & Deploy
```

**Production Environment:**
- VPS: 176.222.53.185
- User: `sip` (application) / `core` (admin)
- Port: 5003
- Container: sip-docs
- Domain: docs.sip-protocol.org
- SSL: Let's Encrypt (auto-renew)

---

## Prerequisites

### Required Access

Before deploying, ensure you have:

| Access Type | How to Verify | How to Request |
|-------------|---------------|----------------|
| GitHub repo access | Can push to `sip-protocol/docs-sip` | Ask repo admin for collaborator access |
| VPS SSH access | `ssh sip` works | Ask ops team for SSH key |
| GHCR access (for manual deploys) | `docker login ghcr.io` works | Use GitHub PAT with `read:packages` |
| Nginx config access (optional) | `ssh core` works | Ask ops team if needed for SSL/proxy changes |

### Required Credentials

Store these securely (1Password, environment variables, etc.):

```bash
# GitHub Personal Access Token (for GHCR)
GHCR_TOKEN=ghp_xxxxxxxxxxxx

# VPS SSH Key
~/.ssh/id_rsa  # or ~/.ssh/id_ed25519

# SSH Config Entry
Host sip
  HostName 176.222.53.185
  User sip
  Port 22
  IdentityFile ~/.ssh/id_rsa
```

### Local Development Setup

```bash
# Clone repository
git clone https://github.com/sip-protocol/docs-sip.git
cd docs-sip

# Install dependencies
npm install

# Run development server
npm run dev
# Open http://localhost:4321

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Deployment Flow

### Automatic Deployment (Recommended)

The standard deployment flow uses GitHub Actions for continuous deployment:

```
1. Developer commits changes → git push origin main
2. GitHub Actions triggered → .github/workflows/deploy.yml
3. Actions builds Docker image → astro build
4. Image pushed to GHCR → ghcr.io/sip-protocol/docs-sip:latest
5. VPS pulls new image → docker compose pull
6. Container restarted → docker compose up -d
7. Health check verified → docs.sip-protocol.org
```

**Steps:**

```bash
# 1. Make changes locally
cd /path/to/docs-sip
# Edit files in src/content/docs/

# 2. Test locally
npm run dev
# Verify changes at http://localhost:4321

# 3. Commit and push
git add .
git commit -m "docs: update deployment guide"
git push origin main

# 4. Monitor GitHub Actions
# Visit: https://github.com/sip-protocol/docs-sip/actions
# Wait for "Deploy" workflow to complete (~3-5 minutes)

# 5. Verify deployment
curl -I https://docs.sip-protocol.org
# Should return 200 OK

# 6. Check in browser
# Visit https://docs.sip-protocol.org
# Hard refresh (Cmd+Shift+R / Ctrl+F5) to bypass cache
```

**GitHub Actions Workflow:**

The workflow (`.github/workflows/deploy.yml`) automatically:
- Runs on push to `main` branch
- Builds Astro site with static output
- Creates Docker image with Nginx
- Pushes to GitHub Container Registry
- (Optional) Triggers webhook for auto-deploy on VPS

**Monitoring Deployment:**
- GitHub Actions: https://github.com/sip-protocol/docs-sip/actions
- Check Slack #deployments channel (if configured)
- Check VPS logs: `ssh sip "docker compose logs sip-docs --tail=50"`

---

## Manual Deployment

Use manual deployment when:
- GitHub Actions fails
- Emergency hotfix needed
- Testing deployment process
- CI/CD pipeline down

### Option 1: VPS-Side Pull (Fastest)

```bash
# SSH into production VPS
ssh sip

# Navigate to application directory
cd ~/app

# Pull latest image from GHCR
docker compose pull sip-docs

# Restart container with new image
docker compose up -d sip-docs

# Verify container started
docker compose ps sip-docs

# Check logs for errors
docker compose logs sip-docs --tail=50 --timestamps

# Verify service responds
curl http://localhost:5003/

# Verify external access
curl -I https://docs.sip-protocol.org
```

**Estimated time:** 2-3 minutes

### Option 2: Build and Push Manually

If CI/CD is broken or you need to deploy from local changes:

```bash
# 1. Build Docker image locally
cd /path/to/docs-sip

# Login to GHCR
echo $GHCR_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Build image
docker build -t ghcr.io/sip-protocol/docs-sip:manual-$(date +%s) .
docker tag ghcr.io/sip-protocol/docs-sip:manual-* ghcr.io/sip-protocol/docs-sip:latest

# Push to GHCR
docker push ghcr.io/sip-protocol/docs-sip:manual-*
docker push ghcr.io/sip-protocol/docs-sip:latest

# 2. Deploy on VPS (same as Option 1)
ssh sip "cd ~/app && docker compose pull sip-docs && docker compose up -d sip-docs"

# 3. Verify
curl -I https://docs.sip-protocol.org
```

**Estimated time:** 5-10 minutes (depending on build time and network)

### Option 3: Direct Build on VPS (Emergency Only)

**Warning:** Not recommended for production. Use only if GHCR is down or inaccessible.

```bash
# SSH into VPS
ssh sip

# Clone or pull latest code
cd ~/
git clone https://github.com/sip-protocol/docs-sip.git temp-build
cd temp-build

# Or if already cloned:
cd ~/temp-build
git pull origin main

# Build Docker image locally on VPS
docker build -t sip-docs-local:latest .

# Update docker-compose.yml temporarily to use local image
cd ~/app
nano docker-compose.yml
# Change: image: ghcr.io/sip-protocol/docs-sip:latest
# To:     image: sip-docs-local:latest

# Restart with local image
docker compose up -d sip-docs

# Verify
curl http://localhost:5003/
curl -I https://docs.sip-protocol.org

# Cleanup
cd ~/
rm -rf temp-build
```

**Estimated time:** 10-15 minutes

---

## Rollback Procedures

Rollback when:
- New deployment breaks site
- Critical content error published
- Performance degradation after deploy
- Need to revert to known-good state

### Quick Rollback (Docker Tag)

**Fastest method:** Use a previous Docker image tag.

```bash
# SSH into VPS
ssh sip
cd ~/app

# Check available tags on GHCR
# Visit: https://github.com/sip-protocol/docs-sip/pkgs/container/docs-sip

# Edit docker-compose.yml to use specific tag
nano docker-compose.yml

# Change from:
services:
  docs:
    image: ghcr.io/sip-protocol/docs-sip:latest

# To previous SHA (find in GitHub Actions):
services:
  docs:
    image: ghcr.io/sip-protocol/docs-sip:sha-abc1234

# Pull old image
docker compose pull sip-docs

# Restart with old image
docker compose up -d sip-docs

# Verify rollback successful
curl http://localhost:5003/
curl -I https://docs.sip-protocol.org

# Check content is correct (inspect specific page that broke)
curl https://docs.sip-protocol.org/guides/quickstart/ | grep "expected content"
```

**Estimated time:** 2-3 minutes

### Git Revert and Redeploy

**Preferred for content issues:** Create revert commit to preserve history.

```bash
# In local development environment
cd /path/to/docs-sip

# Find problematic commit
git log --oneline -10

# Revert the commit (creates new commit)
git revert abc1234
git push origin main

# GitHub Actions will automatically deploy
# Monitor at: https://github.com/sip-protocol/docs-sip/actions

# Or manually deploy to speed up:
ssh sip "cd ~/app && docker compose pull sip-docs && docker compose up -d sip-docs"
```

**Estimated time:** 5-7 minutes (with CI/CD) or 3 minutes (manual)

### Emergency: Swap to Backup Container

If you maintain blue/green containers:

```bash
# SSH as admin user (for nginx config changes)
ssh core

# Edit nginx configuration
sudo nano /etc/nginx/sites-enabled/sip-docs.conf

# Change proxy_pass to backup container:
# From: proxy_pass http://localhost:5003;
# To:   proxy_pass http://localhost:5004;  # Backup container

# Test configuration
sudo nginx -t

# Reload nginx (zero-downtime)
sudo systemctl reload nginx

# Verify
curl -I https://docs.sip-protocol.org
```

**Note:** Requires backup container pre-deployed. See "Blue/Green Deployment" section.

---

## Health Check Verification

After any deployment or rollback, verify the site is healthy:

### Automated Health Checks

```bash
# SSH into VPS
ssh sip

# Check container status
docker compose ps sip-docs
# Should show: State: Up (healthy)

# Check health endpoint (if configured)
curl http://localhost:5003/

# Check external HTTPS access
curl -I https://docs.sip-protocol.org

# Check SSL certificate valid
openssl s_client -connect docs.sip-protocol.org:443 -servername docs.sip-protocol.org < /dev/null 2>/dev/null | openssl x509 -noout -dates

# Check logs for errors
docker compose logs sip-docs --tail=100 | grep -i error

# Check nginx proxy working
ssh core "sudo nginx -t"
```

### Manual Verification Checklist

Open browser and verify:

- [ ] Site loads: https://docs.sip-protocol.org
- [ ] Homepage renders correctly
- [ ] Navigation menu works
- [ ] Search functionality works (try searching for "stealth")
- [ ] Images load correctly
- [ ] Links work (check 3-5 random internal links)
- [ ] Mobile responsive (test on mobile device or resize browser)
- [ ] SSL certificate valid (no browser warnings)
- [ ] Page load time reasonable (<3 seconds)

### Key Pages to Verify

After deployment, spot-check these critical pages:

```bash
# Homepage
curl -s https://docs.sip-protocol.org/ | grep "<title>"

# Getting Started
curl -I https://docs.sip-protocol.org/guides/getting-started/

# API Reference
curl -I https://docs.sip-protocol.org/reference/api/

# SDK Documentation
curl -I https://docs.sip-protocol.org/reference/sdk/
```

Expected: All return `200 OK`

---

## Common Deployment Issues

### Issue 1: GitHub Actions Failing

**Symptoms:**
- Deploy workflow shows red X
- Error in build or push step

**Diagnosis:**
```bash
# Check GitHub Actions logs
# Visit: https://github.com/sip-protocol/docs-sip/actions
# Click on failed workflow → Click on failed step

# Common errors:
# - "npm ERR! code ELIFECYCLE" → Build failed
# - "denied: permission_denied" → GHCR access issue
# - "Error: Process completed with exit code 1" → Generic build error
```

**Solutions:**

**A. Build Failure (npm/astro error)**
```bash
# Test build locally first
cd /path/to/docs-sip
npm install
npm run build

# If fails locally, fix the error
# Common: broken link, invalid MDX, missing image

# Once fixed:
git commit -am "fix: resolve build error"
git push origin main
```

**B. GHCR Permission Denied**
```bash
# Check GitHub Actions secrets
# Settings → Secrets and variables → Actions
# Ensure GHCR_TOKEN is set and valid

# Regenerate token if expired:
# GitHub → Settings → Developer settings → Personal access tokens
# Create token with "write:packages" permission
# Update GHCR_TOKEN secret in repo settings
```

**C. Rate Limit Exceeded**
```bash
# If GitHub rate limit hit, wait 1 hour or:
# Use manual deployment (Option 2 or 3 above)
```

---

### Issue 2: Container Won't Start

**Symptoms:**
- `docker compose ps` shows container as "Exited" or "Restarting"
- Site returns 502 Bad Gateway

**Diagnosis:**
```bash
ssh sip
cd ~/app

# Check container status
docker compose ps sip-docs

# Check logs for startup errors
docker compose logs sip-docs --tail=100
```

**Solutions:**

**A. Port Already in Use**
```bash
# Check what's using port 5003
sudo lsof -i :5003

# If another service is using it:
# Option 1: Stop the other service
docker stop <container-using-port>

# Option 2: Change sip-docs port in docker-compose.yml
nano docker-compose.yml
# Change: "5003:80" to "5004:80" (example)
# Also update nginx proxy_pass
```

**B. Image Pull Failed**
```bash
# Try pulling manually
docker compose pull sip-docs

# If fails with authentication error:
echo $GHCR_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
docker compose pull sip-docs

# If fails with "image not found":
# Check image exists: https://github.com/sip-protocol/docs-sip/pkgs/container/docs-sip
# Or build locally (Option 3 in Manual Deployment)
```

**C. OOM (Out of Memory)**
```bash
# Check system memory
free -m

# Check if container was OOM killed
docker compose logs sip-docs | grep -i "killed"

# Temporary fix: Increase memory limit
nano docker-compose.yml
# Add under sip-docs service:
#   mem_limit: 512m

# Restart
docker compose up -d sip-docs

# Permanent fix: Optimize build or upgrade VPS
```

---

### Issue 3: 502 Bad Gateway

**Symptoms:**
- Browser shows "502 Bad Gateway"
- Nginx error in browser

**Diagnosis:**
```bash
# Check nginx status
ssh core
sudo systemctl status nginx

# Check nginx error logs
sudo tail -50 /var/log/nginx/error.log

# Check if container is running
ssh sip
docker compose ps sip-docs
```

**Solutions:**

**A. Container Not Running**
```bash
# Start container
ssh sip
cd ~/app
docker compose up -d sip-docs

# Verify running
docker compose ps sip-docs
curl http://localhost:5003/
```

**B. Nginx Proxy Misconfigured**
```bash
ssh core

# Test nginx config
sudo nginx -t

# If error, check proxy_pass in config
sudo nano /etc/nginx/sites-enabled/sip-docs.conf

# Should have:
# proxy_pass http://localhost:5003;

# Reload nginx
sudo systemctl reload nginx
```

**C. Firewall Blocking**
```bash
# Check firewall rules
ssh core
sudo ufw status

# Ensure port 443 (HTTPS) is open
sudo ufw allow 443/tcp
sudo ufw reload
```

---

### Issue 4: SSL Certificate Errors

**Symptoms:**
- Browser shows "Your connection is not private"
- Certificate expired warning

**Diagnosis:**
```bash
ssh core

# Check certificate status
sudo certbot certificates

# Check certificate expiry
openssl s_client -connect docs.sip-protocol.org:443 < /dev/null 2>/dev/null | openssl x509 -noout -dates
```

**Solutions:**

**A. Certificate Expired**
```bash
ssh core

# Renew certificate
sudo certbot renew --nginx

# If fails, renew manually
sudo certbot certonly --nginx -d docs.sip-protocol.org

# Reload nginx
sudo systemctl reload nginx

# Verify
curl -I https://docs.sip-protocol.org
```

**B. Auto-Renewal Failed**
```bash
# Check certbot timer
sudo systemctl status certbot.timer

# Enable timer if disabled
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Test renewal
sudo certbot renew --dry-run
```

---

### Issue 5: Content Not Updating

**Symptoms:**
- Deployed successfully but content is old
- Changes not visible on site

**Diagnosis:**
```bash
# Check if new image was pulled
ssh sip
cd ~/app
docker compose images | grep sip-docs

# Check container started recently
docker compose ps sip-docs
# Look at "Created" timestamp

# Check browser cache
# Hard refresh: Cmd+Shift+R (Mac) or Ctrl+F5 (Windows/Linux)
```

**Solutions:**

**A. Browser Cache**
```bash
# User needs to hard refresh or clear cache
# Or wait for cache TTL (usually 5-10 minutes)

# To force immediate update, add cache-busting:
# In astro.config.mjs, add build hash to assets
```

**B. CDN/Proxy Cache (if using Cloudflare, etc.)**
```bash
# Purge CDN cache
# Cloudflare: Dashboard → Caching → Purge Everything

# Or use API:
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

**C. Wrong Image Pulled**
```bash
# Verify correct image tag
ssh sip
cd ~/app
cat docker-compose.yml | grep "image:"

# Should be: ghcr.io/sip-protocol/docs-sip:latest
# Or specific SHA for rollback

# Force pull latest
docker compose pull sip-docs
docker compose up -d sip-docs --force-recreate
```

---

### Issue 6: Search Not Working

**Symptoms:**
- Site search returns no results or errors
- Search index not built

**Diagnosis:**
```bash
# Astro Starlight search is built at build time
# Check if pagefind index exists in build

# SSH into container
ssh sip
docker exec -it sip-docs sh

# Check if search index exists
ls -la /usr/share/nginx/html/pagefind/

# Exit container
exit
```

**Solutions:**

**A. Search Index Missing**
```bash
# Rebuild site locally to verify
cd /path/to/docs-sip
npm run build
ls dist/pagefind/  # Should contain pagefind.js, etc.

# If missing locally:
# Check astro.config.mjs has pagefind enabled

# If works locally but not in Docker:
# Check Dockerfile includes pagefind in build
# Rebuild and redeploy
```

**B. Search Assets Not Loading**
```bash
# Check nginx serves pagefind directory
ssh core
sudo nano /etc/nginx/sites-enabled/sip-docs.conf

# Ensure static assets served correctly:
location / {
    proxy_pass http://localhost:5003;
    # No special config needed for pagefind
}

# Reload nginx
sudo systemctl reload nginx
```

---

## Advanced: Blue/Green Deployment

Blue/Green deployment enables zero-downtime deploys by maintaining two containers.

### Setup Blue/Green

**1. Update docker-compose.yml:**

```yaml
name: sip

services:
  docs-blue:
    image: ghcr.io/sip-protocol/docs-sip:latest
    container_name: sip-docs-blue
    ports:
      - "5003:80"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost"]
      interval: 30s
      timeout: 10s
      retries: 3

  docs-green:
    image: ghcr.io/sip-protocol/docs-sip:latest
    container_name: sip-docs-green
    ports:
      - "5004:80"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost"]
      interval: 30s
      timeout: 10s
      retries: 3
```

**2. Update nginx to use active container:**

```bash
ssh core
sudo nano /etc/nginx/sites-enabled/sip-docs.conf

# Add upstream block:
upstream docs_backend {
    server localhost:5003;  # Blue (active)
    # server localhost:5004;  # Green (standby)
}

server {
    listen 443 ssl http2;
    server_name docs.sip-protocol.org;

    location / {
        proxy_pass http://docs_backend;
        # ... other proxy settings
    }
}
```

**3. Deploy to green, then swap:**

```bash
# Deploy new version to green
ssh sip
cd ~/app
docker compose pull docs-green
docker compose up -d docs-green

# Wait for health check
docker compose ps docs-green  # Wait for "healthy"

# Test green container
curl http://localhost:5004/

# If good, swap nginx to green
ssh core
sudo nano /etc/nginx/sites-enabled/sip-docs.conf
# Change upstream to:
#   server localhost:5004;  # Green (active)
#   # server localhost:5003;  # Blue (standby)

sudo nginx -t
sudo systemctl reload nginx

# Verify site uses green
curl -I https://docs.sip-protocol.org

# Next deploy, reverse (deploy to blue, swap back)
```

**Benefits:**
- Zero downtime deploys
- Instant rollback (just swap nginx back)
- Test new version before switching

---

## Deployment Checklist

Use this checklist for planned deployments:

### Pre-Deployment

- [ ] Changes tested locally (`npm run dev`)
- [ ] Production build successful (`npm run build`)
- [ ] No broken links (use link checker)
- [ ] Images optimized and loading
- [ ] Search working locally
- [ ] No TypeScript errors (`npm run check` if available)
- [ ] Deployment window communicated (if significant changes)
- [ ] Backup of current version noted (Docker tag or git SHA)

### Deployment

- [ ] Code pushed to main branch
- [ ] GitHub Actions workflow triggered
- [ ] Workflow completed successfully (green checkmark)
- [ ] VPS pulled new image (if manual)
- [ ] Container restarted
- [ ] Health checks passing

### Post-Deployment

- [ ] Site loads: https://docs.sip-protocol.org
- [ ] Key pages verified (see Health Check section)
- [ ] Search functionality works
- [ ] No errors in browser console
- [ ] No errors in container logs
- [ ] SSL certificate valid
- [ ] Mobile responsive (quick check)
- [ ] Deployment announced (Slack, Discord, etc.)
- [ ] Monitor for 15 minutes (check logs, Sentry, etc.)

### Rollback (if needed)

- [ ] Rollback procedure executed (see Rollback section)
- [ ] Health checks passing after rollback
- [ ] Users notified of rollback
- [ ] Issue logged for post-mortem
- [ ] Root cause identified before re-deploying

---

## Monitoring & Logging

### Real-Time Logs

```bash
# SSH into VPS
ssh sip

# Tail logs in real-time
cd ~/app
docker compose logs -f sip-docs

# Tail last 100 lines
docker compose logs sip-docs --tail=100 --timestamps

# Filter for errors only
docker compose logs sip-docs | grep -i error

# Check nginx access logs (via core user)
ssh core
sudo tail -f /var/log/nginx/access.log | grep docs.sip-protocol.org
```

### Historical Logs

```bash
# Check logs from last 24 hours
docker compose logs sip-docs --since 24h

# Check logs for specific time range
docker compose logs sip-docs --since 2025-12-04T10:00:00 --until 2025-12-04T12:00:00
```

### Metrics to Monitor

- **Container uptime:** `docker compose ps`
- **Response time:** `curl -w "@curl-format.txt" -o /dev/null -s https://docs.sip-protocol.org`
- **Error rate:** Check Sentry or logs for 4xx/5xx errors
- **SSL expiry:** `sudo certbot certificates`
- **Disk usage:** `df -h`

### Alerts (if configured)

- Uptime monitor (UptimeRobot, Pingdom) for downtime alerts
- Sentry for application errors
- Slack/Discord webhooks for deployment notifications

---

## Troubleshooting Decision Tree

```
Site not loading?
├─ 502 Bad Gateway
│  ├─ Container running? No → Start container
│  └─ Nginx configured? No → Check nginx config
│
├─ 503 Service Unavailable
│  └─ Container starting? Yes → Wait for health check
│
├─ 404 Not Found
│  └─ Wrong nginx config? Yes → Check proxy_pass
│
├─ SSL Warning
│  └─ Certificate expired? Yes → Renew certbot
│
└─ Timeout
   └─ Firewall blocking? Yes → Check ufw rules

Content not updating?
├─ Deployed recently? No → Deploy first
├─ Cache issue? Yes → Hard refresh browser
└─ Wrong image? Yes → Check docker-compose.yml tag

Container won't start?
├─ Port conflict? Yes → Check lsof -i :5003
├─ Image missing? Yes → docker compose pull
└─ OOM killed? Yes → Increase memory limit
```

---

## Emergency Procedures

### Complete Site Outage (P0)

```bash
# 1. Quick assessment (60 seconds)
ssh sip
docker compose ps  # Is container running?
curl http://localhost:5003/  # Is app responding?
curl https://docs.sip-protocol.org  # Is nginx working?

# 2. Quick fix attempts (5 minutes)
docker compose restart sip-docs  # Restart container
# OR
docker compose down && docker compose up -d  # Full restart

# 3. If still down, rollback (2 minutes)
# See "Rollback Procedures" section above

# 4. If rollback fails, use backup HTML
ssh core
sudo nano /etc/nginx/sites-enabled/sip-docs.conf
# Change proxy_pass to serve static backup:
# root /var/www/docs-backup;
# try_files $uri $uri/ =404;
sudo systemctl reload nginx

# 5. Post incident communication
# Announce in #incidents, update status page
# Begin root cause investigation
```

### Security Incident

```bash
# If site compromised or malicious content detected:

# 1. Immediately take site offline
ssh sip
docker compose stop sip-docs

# 2. Put up maintenance page
ssh core
sudo nano /etc/nginx/sites-enabled/sip-docs.conf
# Change to serve static maintenance page:
# return 503;
# add_header Retry-After 3600;
sudo systemctl reload nginx

# 3. Notify security team and management
# 4. Begin incident investigation
# 5. Do NOT restart until cleared by security
```

---

## Contacts & Resources

### Key Personnel

| Role | Contact | Availability |
|------|---------|--------------|
| On-Call Engineer | See rotation schedule | 24/7 |
| DevOps Lead | [Slack/Email] | Business hours |
| Engineering Manager | [Slack/Email] | Business hours |

### Important Links

- GitHub Repository: https://github.com/sip-protocol/docs-sip
- GitHub Actions: https://github.com/sip-protocol/docs-sip/actions
- GHCR Packages: https://github.com/sip-protocol/docs-sip/pkgs/container/docs-sip
- Production Site: https://docs.sip-protocol.org
- VPS Provider: [Provider dashboard]

### Related Documentation

- Incident Response Runbook: `/docs/runbooks/incident-response.md` (sip-protocol repo)
- VPS Port Registry: `~/.ssh/vps-port-registry.md`
- SSH Config: `~/.ssh/config`
- Astro Documentation: https://docs.astro.build
- Starlight Documentation: https://starlight.astro.build

---

## Runbook Maintenance

**This runbook should be updated:**
- After infrastructure changes
- When deployment process changes
- After learning from incidents
- Quarterly review

**How to update:**
1. Create branch: `git checkout -b docs/update-deployment-runbook`
2. Edit this file
3. Test procedures in staging/dev
4. Create PR for review
5. Merge and announce updates

**Next Review Date:** 2026-03-04

---

**Last Updated:** 2025-12-04
**Maintained By:** SIP Protocol Engineering Team

---

*Bismillah, may our deployments be smooth and our rollbacks swift. Alhamdulillah for automation and documentation!*
