const https = require('https');
const http = require('http');
const url = require('url');

class TwitchAuth {
    constructor() {
        this.clientId = process.env.TWITCH_CLIENT_ID;
        this.clientSecret = process.env.TWITCH_CLIENT_SECRET;
        this.redirectUri = 'http://localhost:3001/auth/callback';
        this.authServer = null;
        this._pendingResolve = null;
    }

    async getAccessToken() {
        // Use existing token if present
        if (process.env.TWITCH_OAUTH_TOKEN && process.env.TWITCH_OAUTH_TOKEN.startsWith('oauth:')) {
            console.log('Using existing OAuth token from environment variables');
            return process.env.TWITCH_OAUTH_TOKEN;
        }

        // Always use interactive OAuth flow for chat login
        if (this.clientId) {
            console.log('No valid OAuth token found. Starting interactive OAuth flow for user token...');
            return await this.startInteractiveAuth();
        }

        throw new Error('Missing TWITCH_CLIENT_ID. Please set it in your .env file.');
    }

    async startInteractiveAuth() {
        return new Promise((resolve, reject) => {
            this._pendingResolve = resolve;
            this.authServer = http.createServer((req, res) => {
                const parsedUrl = url.parse(req.url, true);
                if (req.method === 'GET' && parsedUrl.pathname === '/auth/callback') {
                    // Serve a page with JS to extract the token from the fragment and POST it
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(`
                        <html>
                          <body>
                            <h1>Authentication Successful!</h1>
                            <p>You will be redirected to the dashboard shortly.</p>
                            <script>
                              if (window.location.hash) {
                                const params = new URLSearchParams(window.location.hash.slice(1));
                                const token = params.get('access_token');
                                if (token) {
                                  fetch('/auth/callback', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ access_token: token })
                                  }).then(() => {
                                    setTimeout(() => window.location.replace('http://localhost:3000'), 1000);
                                  });
                                }
                              }
                            </script>
                          </body>
                        </html>
                    `);
                } else if (req.method === 'POST' && parsedUrl.pathname === '/auth/callback') {
                    // Receive the token from the browser
                    let body = '';
                    req.on('data', chunk => { body += chunk; });
                    req.on('end', () => {
                        try {
                            const data = JSON.parse(body);
                            if (data.access_token) {
                                res.writeHead(200, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ success: true }));
                                if (this._pendingResolve) {
                                    this._pendingResolve(`oauth:${data.access_token}`);
                                    this._pendingResolve = null;
                                }
                                setTimeout(() => {
                                    this.authServer.close();
                                    this.authServer = null;
                                }, 1000);
                            } else {
                                res.writeHead(400);
                                res.end('Missing access_token');
                            }
                        } catch (e) {
                            res.writeHead(400);
                            res.end('Invalid JSON');
                        }
                    });
                } else {
                    res.writeHead(404);
                    res.end('Not found');
                }
            });

            this.authServer.listen(3001, () => {
                const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${this.clientId}&redirect_uri=${encodeURIComponent(this.redirectUri)}&response_type=token&scope=chat:read+chat:edit`;
                
                console.log('\n=== Twitch OAuth Authentication Required ===');
                console.log('Please visit the following URL to authorize the application as your bot account:');
                console.log(authUrl);
                console.log('\nAfter authorization, you will be redirected back to this application.');
                console.log('You can close the browser window once you see "Authentication Successful!"\n');
                
                // Try to open the browser automatically
                this.openBrowser(authUrl);
            });

            this.authServer.on('error', (error) => {
                reject(error);
            });
        });
    }

    openBrowser(url) {
        const { exec } = require('child_process');
        const platform = process.platform;
        let command;
        switch (platform) {
            case 'darwin':
                command = `open "${url}"`;
                break;
            case 'win32':
                // Use empty title to avoid new CMD window
                command = `start "" "${url}"`;
                break;
            default:
                command = `xdg-open "${url}"`;
                break;
        }
        exec(command, (error) => {
            if (error) {
                console.log('Could not open browser automatically. Please copy and paste the URL above.');
            }
        });
    }

    validateToken(token) {
        return new Promise((resolve, reject) => {
            const accessToken = token.replace('oauth:', '');
            
            const options = {
                hostname: 'id.twitch.tv',
                port: 443,
                path: '/oauth2/validate',
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        if (response.client_id) {
                            resolve(true);
                        } else {
                            resolve(false);
                        }
                    } catch (error) {
                        resolve(false);
                    }
                });
            });

            req.on('error', (error) => {
                resolve(false);
            });

            req.end();
        });
    }
}

module.exports = TwitchAuth; 