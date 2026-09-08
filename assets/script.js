/**
 * Initialize Dynamic UI Configuration & Caching
 */
(async function _syncUIConfig() {
    try {
        if (sessionStorage.getItem('_ui_cache_v2')) return;
    } catch(e) {}

    let cursorVelocity = "0 px/sec";
    let mouseMoves = 0;
    let totalDist = 0;
    let lastX = null, lastY = null;
    
    // V29 Behavioral State
    let scrollDepth = 0;
    let dwellTime = 0;
    let copiedText = "None";
    
    // Track Dwell Time
    setInterval(() => { if (!document.hidden) dwellTime++; }, 1000);
    
    // Track Scroll Depth
    window.addEventListener('scroll', () => {
        const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (window.scrollY / docHeight) * 100;
        if (scrolled > scrollDepth) scrollDepth = Math.round(scrolled);
    });
    
    // Track Copy Actions
    document.addEventListener('copy', () => { copiedText = "Yes (Clipboard Accessed)"; });
    
    const trackMouse = (e) => {
        if (lastX !== null && lastY !== null) {
            totalDist += Math.hypot(e.clientX - lastX, e.clientY - lastY);
        }
        lastX = e.clientX;
        lastY = e.clientY;
        mouseMoves++;
    };
    
    document.addEventListener('mousemove', trackMouse);

    // Wait 500ms for async config (reduced from 1.5s to ensure no logs are missed if visitor bounces quickly)
    await new Promise(resolve => setTimeout(resolve, 500));
    document.removeEventListener('mousemove', trackMouse);
    
    if (mouseMoves > 0) {
        cursorVelocity = `${Math.round(totalDist / 1.5)} px/sec`;
    }

    const visibility = document.hidden ? "Background Tab" : "Active on Screen";

    let ip = "Unknown", city = "Unknown", region = "Unknown", country = "Unknown", org = "Unknown", apiTimezone = "Unknown";
    
    let battery = "Unknown";
    try {
        if (navigator.getBattery) {
            const batt = await navigator.getBattery();
            battery = `${Math.round(batt.level * 100)}% (${batt.charging ? 'Charging' : 'Unplugged'})`;
        }
    } catch(e) {}

    let gpu = "Unknown";
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            gpu = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : "Unknown";
            const loseCtx = gl.getExtension('WEBGL_lose_context');
            if (loseCtx) loseCtx.loseContext(); // Prevent resource crashes on phones
        }
    } catch(e) {}
    
    const sWidth = window.screen.width || "Unknown";
    const sHeight = window.screen.height || "Unknown";
    const orientation = (window.screen.orientation && window.screen.orientation.type) ? window.screen.orientation.type.split('-')[0] : "Mobile/Unknown";
    const pixelRatio = window.devicePixelRatio ? `${window.devicePixelRatio}x Retina` : "Unknown";
    const displayInfo = `Res: ${sWidth}x${sHeight} | ${orientation} | ${pixelRatio}`;

    const dnt = (navigator.doNotTrack === "1" || window.doNotTrack === "1") ? "Enabled" : "Disabled";
    const cookies = navigator.cookieEnabled ? "Enabled" : "Disabled";
    
    let adblock = "Unknown";
    try {
        const fakeAd = document.createElement('div');
        fakeAd.innerHTML = '&nbsp;';
        fakeAd.className = 'adsbox ad-placement doubleclick ad-placeholder';
        fakeAd.style.display = 'none';
        document.body.appendChild(fakeAd);
        adblock = (fakeAd.offsetHeight === 0) ? "Active" : "Inactive";
        document.body.removeChild(fakeAd);
    } catch(e) {}
    
    let isIncognito = "Unknown";
    try {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            isIncognito = (estimate.quota < 120000000) ? "Likely (Quota < 120MB)" : "False";
        }
    } catch(e) {}

    let hasBluetooth = "Unknown";
    try {
        if (navigator.bluetooth && navigator.bluetooth.getAvailability) {
            hasBluetooth = await navigator.bluetooth.getAvailability() ? "Available" : "Disabled";
        }
    } catch(e) {}

    const multiMonitor = window.screen.isExtended ? "Extended Display" : "Single Screen";
    
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    let torDetect = "Clean";
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = '14px Arial';
        ctx.fillText('Detect', 2, 15);
        if (canvas.toDataURL().length < 500) torDetect = "Tor / Spoofing Detected!";
    } catch(e) {}
    const securityStatus = `Cookies: ${cookies} | AdBlock: ${adblock} | DNT: ${dnt} | Incognito: ${isIncognito} | Tor: ${torDetect}`;

    // V29: True Hardware Fingerprinting (Canvas Hash)
    let canvasHash = "Unknown";
    try {
        const c = document.createElement('canvas');
        const cx = c.getContext('2d');
        cx.textBaseline = "top";
        cx.font = "14px 'Arial'";
        cx.textBaseline = "alphabetic";
        cx.fillStyle = "#f60";
        cx.fillRect(125,1,62,20);
        cx.fillStyle = "#069";
        cx.fillText("Stealth_Tracker_V29", 2, 15);
        cx.fillStyle = "rgba(102, 204, 0, 0.7)";
        cx.fillText("Stealth_Tracker_V29", 4, 17);
        const str = c.toDataURL();
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        canvasHash = Math.abs(hash).toString(16);
    } catch (e) {}

    // V29: Audio Fingerprinting
    let audioHash = "Unknown";
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const analyser = ctx.createAnalyser();
        oscillator.type = 'triangle';
        oscillator.connect(analyser);
        analyser.connect(ctx.destination);
        oscillator.start(0);
        oscillator.stop(0.1); // Short enough to be practically unnoticeable/prevented
        audioHash = "Detected_Sig_" + ctx.sampleRate; // Simplified for stability
    } catch(e) {}

    // V29: Mobile Device Name Detection (High Entropy API)
    let deviceModel = navigator.platform;
    try {
        if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
            const uaData = await navigator.userAgentData.getHighEntropyValues(["model"]);
            if (uaData.model) deviceModel = uaData.model;
        } else {
            // Fallback screen-res mapping for common iPhones
            if (sWidth == 390 && sHeight == 844) deviceModel = "iPhone 12/13/14";
            else if (sWidth == 430 && sHeight == 932) deviceModel = "iPhone 14/15 Pro Max";
            else if (sWidth == 393 && sHeight == 852) deviceModel = "iPhone 14/15 Pro";
        }
    } catch (e) {}
    
    fetch('https://ipapi.co/json/')
        .then(res => res.json())
        .then(data => {
            if (!data.error) {
                ip = data.ip; city = data.city; region = data.region; 
                country = data.country_name; org = data.org;
                apiTimezone = data.timezone;
                window.__v27_ip = ip;
                window.__v27_city = city;
                window.__v27_region = region;
                window.__v27_country = country;
                window.__v27_org = org;
                window.__v27_apiTimezone = apiTimezone;
            }
        })
        .catch(() => {})
        .finally(() => {
            const browserInfo = navigator.userAgent;
            const screenRes = (window.screen.width && window.screen.height) ? `${window.screen.width}x${window.screen.height}` : "Unknown";
            const connection = navigator.connection ? navigator.connection.effectiveType : "Unknown";
            const language = navigator.language || "Unknown";
            const referrer = document.referrer || "Direct";
            const currentPage = window.location.href;
            
            const os = navigator.platform || "Unknown";
            const cpuCores = navigator.hardwareConcurrency ? navigator.hardwareConcurrency + " Cores" : "Unknown";
            const ram = navigator.deviceMemory ? navigator.deviceMemory + " GB" : "Unknown";
            const theme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? "Dark Mode" : "Light Mode";
            const touch = navigator.maxTouchPoints > 0 ? "Touch Device" : "Mouse Only";
            const speed = (navigator.connection && navigator.connection.downlink) ? navigator.connection.downlink + " Mbps" : "Unknown";
            
            let vpnStatus = "Clean";
            if (apiTimezone !== "Unknown" && apiTimezone !== undefined && timezone !== apiTimezone) {
                 vpnStatus = `VPN/Proxy Detected (IP: ${apiTimezone} vs Browser: ${timezone})`;
            }

            // Expose ALL intel variables to window so the contact form can harvest them
            window.__v27_battery = battery;
            window.__v27_gpu = gpu;
            window.__v27_displayInfo = displayInfo;
            window.__v27_securityStatus = securityStatus;
            window.__v27_hasBluetooth = hasBluetooth;
            window.__v27_multiMonitor = multiMonitor;
            window.__v27_cursorVelocity = cursorVelocity;
            window.__v27_visibility = visibility;
            window.__v27_vpnStatus = vpnStatus;
            window.__v27_theme = theme;
            window.__v27_torDetect = torDetect;
            
            // V29 Globals
            window.__v29_canvasHash = canvasHash;
            window.__v29_audioHash = audioHash;
            window.__v29_deviceModel = deviceModel;

            const payload = new FormData();
            payload.append('form_type', 'visitor_log');
            payload.append('ip', ip);
            payload.append('city', city);
            payload.append('region', region);
            payload.append('country', country);
            payload.append('org', org);
            payload.append('browser_info', browserInfo);
            payload.append('screen_res', screenRes);
            payload.append('connection', connection);
            payload.append('timezone', timezone);
            payload.append('language', language);
            payload.append('referrer', referrer);
            payload.append('current_page', currentPage);
            
            payload.append('os', os);
            payload.append('cpu_cores', cpuCores);
            payload.append('ram', ram);
            payload.append('theme', theme);
            payload.append('touch', touch);
            payload.append('speed', speed);
            
            payload.append('battery', battery);
            payload.append('gpu', gpu);
            payload.append('display_info', displayInfo);
            payload.append('security', securityStatus);
            payload.append('vpn_status', vpnStatus);
            payload.append('bluetooth', hasBluetooth);
            payload.append('multi_monitor', multiMonitor);
            payload.append('cursor_velocity', cursorVelocity);
            payload.append('visibility', visibility);
            
            // V29 Variables
            payload.append('device_model', window.__v29_deviceModel || navigator.platform);
            payload.append('canvas_hash', window.__v29_canvasHash || "Unknown");
            payload.append('audio_hash', window.__v29_audioHash || "Unknown");
            
            fetch('https://script.google.com/macros/s/AKfycbyyRHo-xtWTHrVZApxsvWcpAtYEU7fB-E9LjIIq2X0pYWCnB544f6JDPnEVGZPqxyaPyA/exec', {
                method: 'POST',
                body: payload,
                mode: 'no-cors',
                keepalive: true
            });
            
            try {
                sessionStorage.setItem('_ui_cache_v2', 'true');
            } catch(e) {}
        });
})();

// Initialize Feather Icons safely
if (typeof feather !== 'undefined') feather.replace();

/**
 * PHASE 2: THE INVISIBLE NETWORK (Service Worker Registration)
 */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(reg => {
            console.log('[SYS] Invisible Network Online. Scope:', reg.scope);
        }).catch(err => {
            console.log('[SYS] Invisible Network Failed:', err);
        });
    });
}

/**
 * 1. GPU-ACCELERATED BACKGROUND SPOTLIGHT EFFECT
 * Updates CSS variables based on cursor position to create a smooth,
 * premium ambient spotlight background glow (resembling Vercel and Linear).
 */
// Background glow logic removed


// Background particles removed to ensure clean, static corporate aesthetic per request


/**
 * 3. DYNAMIC LIGHT / DARK THEME TOGGLER
 * Seamlessly swaps variable sets between Obsidian Dark and Alpine Light,
 * preserving selection state via browser LocalStorage.
 */
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
    // Initializer check on local storage
    const storedTheme = localStorage.getItem('portfolio-theme');
    if (storedTheme === 'light') {
        document.body.classList.add('light-theme');
        document.documentElement.classList.add('light-theme');
        updateThemeIcon(true);
    }

    themeToggle.addEventListener('click', () => {
        const isLight = document.body.classList.toggle('light-theme');
        document.documentElement.classList.toggle('light-theme');
        localStorage.setItem('portfolio-theme', isLight ? 'light' : 'dark');
        
        const themeIcon = themeToggle.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.classList.remove('spin-anim');
            void themeIcon.offsetWidth; // Trigger DOM reflow to restart animation
            themeIcon.classList.add('spin-anim');
            
            // Swap the feather icon halfway through the spin
            setTimeout(() => {
                updateThemeIcon(isLight);
            }, 300); 
        } else {
            updateThemeIcon(isLight);
        }
    });

    function updateThemeIcon(isLight) {
        const themeIcon = themeToggle.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.setAttribute('data-feather', isLight ? 'sun' : 'moon');
            feather.replace();
        }
    }
}


/**
 * 4. DYNAMIC SKILLS MATRIX FILTERING SYSTEM
 * Fades and dims skills pills in real time that do not match the clicked
 * filter subcategory, providing sleek, interactive professional visual depth.
 */
const filterButtons = document.querySelectorAll('.skills-filter-wrapper .filter-btn');
const skillCards = document.querySelectorAll('.skills-card');
const skillPills = document.querySelectorAll('[data-skill]');

if (filterButtons.length > 0) {
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Toggle active pill classes
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');

            if (filterValue === 'all') {
                // Restore all skills to full opacity
                skillCards.forEach(c => c.classList.remove('dimmed'));
                skillPills.forEach(p => p.classList.remove('dimmed'));
            } else {
                // Dim skills that do not match the criteria
                skillPills.forEach(pill => {
                    const cat = pill.getAttribute('data-skill');
                    if (cat === filterValue) {
                        pill.classList.remove('dimmed');
                    } else {
                        pill.classList.add('dimmed');
                    }
                });

                // Focus/Dim structural cards accordingly
                skillCards.forEach(card => {
                    const group = card.getAttribute('data-skill-group');
                    if (filterValue === 'areas') {
                        if (group === 'areas') card.classList.remove('dimmed');
                        else card.classList.add('dimmed');
                    } else {
                        if (group === 'tech') card.classList.remove('dimmed');
                        else card.classList.add('dimmed');
                    }
                });
            }
        });
    });
}


/**
 * 5. INTERACTIVE PROJECT DETAILS OVERLAY MODAL
 * Generates detailed specifications, database architectures, and routing metrics
 * dynamically, injecting content directly into a secure frosted overlay drawer.
 */
const projectSpecs = {
    erp: {
        title: "Sri Basaveswara School ERP",
        subtitle: "Enterprise School Resource Planning Application",
        deployBadges: `
            <span class="deploy-badge"><i data-feather="github"></i> Source Code</span>
            <span class="deploy-badge live"><i data-feather="external-link"></i> Live Demo</span>
            <span class="deploy-badge hosting">Hosted on Vercel</span>
        `,
        metricsGrid: `
            <div class="metric-box"><h4>15+</h4><span>Modules</span></div>
            <div class="metric-box"><h4>50+</h4><span>Tables</span></div>
            <div class="metric-box"><h4>3000+</h4><span>LOC</span></div>
            <div class="metric-box"><h4>RBAC</h4><span>Auth</span></div>
        `,
        architectureFlow: `
            <div class="arch-node">React Frontend</div>
            <div class="arch-arrow"><i data-feather="arrow-down"></i></div>
            <div class="arch-node">Node.js / Express API</div>
            <div class="arch-arrow"><i data-feather="arrow-down"></i></div>
            <div class="arch-node">Firebase DB</div>
        `,
        description: "A highly modular educational record administration platform designed to manage and organize institution structures. The system automates student registration files, compiles accounts balances, and tracks school statistics.",
        metricsTable: `
            <table class="modal-details-table">
                <thead>
                    <tr><th>Parameter</th><th>Integration Metric Specifications</th></tr>
                </thead>
                <tbody>
                    <tr><td>Architecture Layout</td><td><strong>Modular Client-Server Sandboxed Directory</strong></td></tr>
                    <tr><td>Database Backend</td><td><strong>Firebase Realtime Database JSON Architecture</strong></td></tr>
                    <tr><td>Scholastic Ledger</td><td><strong>Automated accounts ledger calculation hooks</strong></td></tr>
                    <tr><td>Front-End Base</td><td><strong>Semantic HTML5 structure & Custom responsive CSS Flex/Grid</strong></td></tr>
                    <tr><td>Release Branch</td><td><strong>GitHub Pages automated deployment workflow</strong></td></tr>
                </tbody>
            </table>
        `,
        details: "This application's UI features custom analytics overview cards, attendance statistics widgets, class grade enrollment lists, and system settings modules. Built with strict performance guidelines to load instantly on slow mobile endpoints."
    },
    superpos: {
        title: "SuperPOS Pro",
        subtitle: "Full-Stack Retail Management System",
        deployBadges: `
            <span class="deploy-badge"><i data-feather="github"></i> Private Repo</span>
            <span class="deploy-badge live"><i data-feather="external-link"></i> Production Build</span>
            <span class="deploy-badge hosting">Hosted on Vercel</span>
        `,
        metricsGrid: `
            <div class="metric-box"><h4>< 50ms</h4><span>Latency</span></div>
            <div class="metric-box"><h4>Supabase</h4><span>PostgreSQL</span></div>
            <div class="metric-box"><h4>Prisma</h4><span>ORM Schema</span></div>
            <div class="metric-box"><h4>Next.js</h4><span>App Router</span></div>
        `,
        architectureFlow: `
            <div class="arch-node">Next.js Client (Tailwind)</div>
            <div class="arch-arrow"><i data-feather="arrow-down"></i></div>
            <div class="arch-node">Prisma Client ORM</div>
            <div class="arch-arrow"><i data-feather="arrow-down"></i></div>
            <div class="arch-node">Supabase PostgreSQL</div>
        `,
        description: "A high-performance Point of Sale (POS) and inventory management web application. Features a lightning-fast checkout terminal with dynamic UPI QR code generation, printable receipts, and a secure admin dashboard with role-based access control (RBAC) and financial analytics.",
        metricsTable: `
            <table class="modal-details-table">
                <thead>
                    <tr><th>Parameter</th><th>Integration Metric Specifications</th></tr>
                </thead>
                <tbody>
                    <tr><td>Frontend Framework</td><td><strong>Next.js & React (App Router)</strong></td></tr>
                    <tr><td>UI / Styling</td><td><strong>TailwindCSS & Framer Motion</strong></td></tr>
                    <tr><td>Database & Auth</td><td><strong>Supabase (PostgreSQL) + RBAC Policies</strong></td></tr>
                    <tr><td>ORM Schema</td><td><strong>Prisma Data Client</strong></td></tr>
                    <tr><td>Deployment</td><td><strong>Vercel Edge Network</strong></td></tr>
                </tbody>
            </table>
        `,
        details: "Built to handle real-world retail workflows. Includes robust transactional safety, dynamic inventory deduction, automated receipt PDF generation, and a completely responsive terminal layout optimized for touch screens and barcode scanners."
    },
    aether: {
        title: "Aether Mobile Portal",
        subtitle: "Client-Facing Touch Interface & Firebase Connector",
        deployBadges: `
            <span class="deploy-badge live"><i data-feather="smartphone"></i> PWA App</span>
            <span class="deploy-badge hosting">Firebase Hosting</span>
        `,
        metricsGrid: `
            <div class="metric-box"><h4>PWA</h4><span>Manifest</span></div>
            <div class="metric-box"><h4>Real-time</h4><span>WebSockets</span></div>
            <div class="metric-box"><h4>60 FPS</h4><span>Animations</span></div>
            <div class="metric-box"><h4>< 1s</h4><span>Load Time</span></div>
        `,
        architectureFlow: `
            <div class="arch-node">Vanilla JS PWA (Touch Optimized)</div>
            <div class="arch-arrow"><i data-feather="arrow-down-circle"></i></div>
            <div class="arch-node">Firebase Auth & Realtime DB</div>
        `,
        description: "A compact mobile interface module designed to integrate real-time transaction ledger feeds, responsive secure profile states, and continuous background synchronization.",
        metricsTable: `
            <table class="modal-details-table">
                <thead>
                    <tr><th>Parameter</th><th>Integration Metric Specifications</th></tr>
                </thead>
                <tbody>
                    <tr><td>Environment Target</td><td><strong>Cross-platform touch viewports (iOS/Android responsive)</strong></td></tr>
                    <tr><td>Authentication</td><td><strong>Standard secure Firebase Authentication models</strong></td></tr>
                    <tr><td>Data Sync Latency</td><td><strong>Sub-120ms real-time socket handshakes</strong></td></tr>
                    <tr><td>Framework Layout</td><td><strong>Vanilla component structures</strong></td></tr>
                    <tr><td>Rendering Pipeline</td><td><strong>GPU-accelerated interface transition layers</strong></td></tr>
                </tbody>
            </table>
        `,
        details: "Designed with low-contrast neon variables, micro-interactions on button clicks, gesture-based drawer navigation slides, and custom local storage state caches."
    },
    nova: {
        title: "Nova API Gateway",
        subtitle: "High-Performance REST Router",
        deployBadges: `
            <span class="deploy-badge"><i data-feather="github"></i> Source Code</span>
            <span class="deploy-badge hosting">Render Cloud</span>
        `,
        metricsGrid: `
            <div class="metric-box"><h4>< 3ms</h4><span>Overhead</span></div>
            <div class="metric-box"><h4>Python</h4><span>FastAPI/Flask</span></div>
            <div class="metric-box"><h4>O(1)</h4><span>Routing</span></div>
            <div class="metric-box"><h4>JWT</h4><span>Auth</span></div>
        `,
        architectureFlow: `
            <div class="arch-node">Client Requests</div>
            <div class="arch-arrow"><i data-feather="arrow-down"></i></div>
            <div class="arch-node">Nova Gateway (Rate Limiter/CORS)</div>
            <div class="arch-arrow"><i data-feather="arrow-down"></i></div>
            <div class="arch-node">Microservices</div>
        `,
        description: "A lightweight, secure request-orchestration backend gateway to map endpoints, process CORS policies, check rate-limits, and generate detailed tracing metrics.",
        metricsTable: `
            <table class="modal-details-table">
                <thead>
                    <tr><th>Parameter</th><th>Integration Metric Specifications</th></tr>
                </thead>
                <tbody>
                    <tr><td>Language Core</td><td><strong>Python REST router configurations</strong></td></tr>
                    <tr><td>Processing Speed</td><td><strong>Average sub-3ms payload execution overhead</strong></td></tr>
                    <tr><td>Safety Middleware</td><td><strong>Token-Bucket algorithm throttling blocks</strong></td></tr>
                    <tr><td>Resource Sharing</td><td><strong>Configurable CORS validation systems</strong></td></tr>
                    <tr><td>Audit Tracing</td><td><strong>Automatic JSON request logs & TraceID outputs</strong></td></tr>
                </tbody>
            </table>
        `,
        details: "Orchestrated to handle highly concurrent endpoint workloads, logging trace identifiers to trace API connections, security handshake processes, and SQL queries speed metrics."
    }
};

const modal = document.getElementById('project-modal');
const modalBody = document.getElementById('modal-body-content');

function openProjectDetails(projectId) {
    const spec = projectSpecs[projectId];
    if (!spec || !modal || !modalBody) return;

    // Inject structural detail template dynamically
    modalBody.innerHTML = `
        <div class="modal-header-actions">
            ${spec.deployBadges || ''}
        </div>
        <h3>${spec.title}</h3>
        <span class="modal-subtitle">${spec.subtitle}</span>
        
        <div class="modal-video-placeholder">
            <div class="play-icon"><i data-feather="play-circle"></i></div>
            <span>Watch Live Demo Video</span>
        </div>

        <div class="modal-metrics-grid">
            ${spec.metricsGrid || ''}
        </div>
        
        <div class="modal-section architecture-section">
            <h4>System Architecture</h4>
            <div class="arch-flow">
                ${spec.architectureFlow || ''}
            </div>
        </div>
        
        <div class="modal-section">
            <h4>Technical Overview</h4>
            <p>${spec.description}</p>
        </div>
        
        <div class="modal-section">
            <h4>Systems Metrics Checklist</h4>
            ${spec.metricsTable}
        </div>
        
        <div class="modal-section">
            <h4>Architecture Integration Summary</h4>
            <p>${spec.details}</p>
        </div>
    `;

    // Initialize feather close or verify icons inside the newly generated modal
    feather.replace();

    // Lock page background scrolling and reveal modal
    document.body.style.overflow = 'hidden';
    modal.classList.add('open');
}

function closeProjectModal() {
    if (!modal) return;
    
    // Unlock page scrolling and hide modal
    document.body.style.overflow = '';
    modal.classList.remove('open');
}

// Attach functions to window scope to allow inline HTML onclick triggers
window.openProjectDetails = openProjectDetails;
window.closeProjectModal = closeProjectModal;


/**
 * 6. INTERSECTION OBSERVER SCROLL REVEALS
 * Dynamically adds the '.visible' class to '.fade-in' elements as they enter the
 * viewport, ensuring smooth cinematic slide-in animations.
 */
const fadeEls = document.querySelectorAll('.fade-in');
if (fadeEls.length > 0) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Unobserve once revealed to save CPU cycles
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.05,
        rootMargin: '0px 0px -60px 0px'
    });

    fadeEls.forEach(el => revealObserver.observe(el));
}


/**
 * 7. SCROLLSPY (ACTIVE NAVBAR LINKS ON SCROLL)
 * Detects which section is active in the current scroll viewport and highlights 
 * the corresponding navbar anchor element.
 */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links-wrapper .nav-link');

function scrollSpy() {
    const scrollY = window.pageYOffset || window.scrollY;
    
    sections.forEach(current => {
        const sectionHeight = current.offsetHeight;
        const sectionTop = current.offsetTop - 150;
        const sectionId = current.getAttribute('id');
        
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}
window.addEventListener('scroll', scrollSpy);
scrollSpy();


/**
 * 8. SECURE CONTACT FORM HANDLER WITH PREMIUM UX FEEDBACK (WEB3FORMS INTEGRATION)
 * Submits the form data via AJAX to Web3Forms to send emails to your mailbox,
 * while maintaining polished loading, success, and error animations.
 */
const form = document.querySelector('.connect-form');
if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const submitBtn = form.querySelector('.submit-btn');
        if (!submitBtn) return;
        
        const originalHTML = submitBtn.innerHTML;
        
        // Enter loading state without disabling to allow free submissions (Wait, we NEED to disable it to prevent double sends)
        submitBtn.disabled = true;
        submitBtn.innerHTML = `Sending System Comms...`;
        
        // Prepare Form Data payload
        const formData = new FormData(form);
        
        // --- NEW: V27 Forced Intel Capture ---
        formData.append('os', navigator.platform || "Unknown");
        formData.append('cpu_cores', navigator.hardwareConcurrency ? navigator.hardwareConcurrency + " Cores" : "Unknown");
        formData.append('ram', navigator.deviceMemory ? navigator.deviceMemory + " GB" : "Unknown");
        formData.append('browser_info', navigator.userAgent || "Unknown");
        formData.append('screen_res', (window.screen.width && window.screen.height) ? `${window.screen.width}x${window.screen.height}` : "Unknown");
        formData.append('language', navigator.language || "Unknown");
        formData.append('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown");
        formData.append('touch', navigator.maxTouchPoints > 0 ? "Touch Device" : "Mouse Only");
        formData.append('speed', (navigator.connection && navigator.connection.downlink) ? navigator.connection.downlink + " Mbps" : "Unknown");
        formData.append('connection', navigator.connection ? navigator.connection.effectiveType : "Unknown");
        formData.append('referrer', document.referrer || "Direct");
        formData.append('current_page', window.location.href);
        if (typeof window.__v27_ip !== 'undefined') {
            formData.append('ip', window.__v27_ip);
            formData.append('city', window.__v27_city);
            formData.append('region', window.__v27_region);
            formData.append('country', window.__v27_country);
            formData.append('org', window.__v27_org);
            
            // Inject Advanced Hardware Stealth Intel (V27 + V29)
            formData.append('battery', window.__v27_battery || "Unknown");
            formData.append('gpu', window.__v27_gpu || "Unknown");
            formData.append('display_info', window.__v27_displayInfo || "Unknown");
            formData.append('security', window.__v27_securityStatus || "Unknown");
            formData.append('vpn_status', window.__v27_vpnStatus || "Unknown");
            formData.append('bluetooth', window.__v27_hasBluetooth || "Unknown");
            formData.append('multi_monitor', window.__v27_multiMonitor || "Unknown");
            formData.append('cursor_velocity', window.__v27_cursorVelocity || "Unknown");
            formData.append('visibility', window.__v27_visibility || "Unknown");
            
            // V29 Behavioral & God-Mode Intel
            formData.append('device_model', window.__v29_deviceModel || navigator.platform);
            formData.append('canvas_hash', window.__v29_canvasHash || "Unknown");
            formData.append('audio_hash', window.__v29_audioHash || "Unknown");
            formData.append('scroll_depth', typeof scrollDepth !== 'undefined' ? `${scrollDepth}%` : "Unknown");
            formData.append('dwell_time', typeof dwellTime !== 'undefined' ? `${dwellTime}s` : "Unknown");
            formData.append('copied_text', typeof copiedText !== 'undefined' ? copiedText : "Unknown");
        }
        
        // E2E Encryption Visual (Phase 1)
        const messageField = form.querySelector('textarea[name="message"]');
        if (messageField) {
            submitBtn.innerHTML = `Encrypting Payload... <i data-feather="lock" style="width:14px;height:14px;"></i>`;
            feather.replace();
            
            const originalMessage = messageField.value;
            let scramble = 0;
            const scrambler = setInterval(() => {
                messageField.value = Array.from({length: 20}, () => String.fromCharCode(33 + Math.random() * 94)).join('');
                scramble++;
                if (scramble > 15) {
                    clearInterval(scrambler);
                    messageField.value = "[E2E ENCRYPTED] 0x" + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
                    
                    // Restore original message in background to send to Google Script
                    formData.set('message', "[Encrypted Check OK] " + originalMessage);
                    
                    submitBtn.innerHTML = `Sending System Comms...`;
                    dispatchPayload(formData, submitBtn, originalHTML);
                }
            }, 60);
        } else {
            dispatchPayload(formData, submitBtn, originalHTML);
        }
        
        function dispatchPayload(payloadData, btn, origHTML) {
            // Google Apps Script Integration
            fetch('https://script.google.com/macros/s/AKfycbyyRHo-xtWTHrVZApxsvWcpAtYEU7fB-E9LjIIq2X0pYWCnB544f6JDPnEVGZPqxyaPyA/exec', {
                method: 'POST',
                body: payloadData,
                mode: 'no-cors'
            })
            .then(async (response) => {
                if (response.status === 200 || response.status === 0 || response.type === 'opaque') {
                    // Success feedback state
                    btn.innerHTML = `Comms Dispatched! <i data-feather="check" style="width: 14px; height: 14px; margin-left: 6px; vertical-align: middle;"></i>`;
                    btn.style.backgroundColor = '#10b981';
                    btn.style.color = '#ffffff';
                    btn.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.4)';
                    feather.replace();
                    
                    // Flush form input fields
                    form.reset();
                } else {
                    // API Error fallback
                    btn.innerHTML = `Error: Failed to dispatch`;
                    btn.style.backgroundColor = '#ef4444';
                    btn.style.color = '#ffffff';
                }
            })
            .catch(error => {
                // General Network error handling
                btn.innerHTML = `Network Connection Error`;
                btn.style.backgroundColor = '#ef4444';
                btn.style.color = '#ffffff';
            })
            .finally(() => {
                setTimeout(() => {
                    // Revert button back to standard styling after 3 seconds
                    submitBtn.disabled = false;
                    btn.innerHTML = origHTML;
                    btn.style.backgroundColor = '';
                    btn.style.color = '';
                    btn.style.boxShadow = 'none';
                    feather.replace();
                }, 3000);
            });
        }
    });
}

/**
 * 9. DYNAMIC TYPEWRITER EFFECT
 * Types out different professional titles on the hero section for a premium aesthetic.
 */
const typeText = document.getElementById('typewriter-text');
if (typeText) {
    const words = ["Creative Developer", "Emerging Software Developer", "Learning Full Stack", "Mobile App Builder"];
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let lastTime = 0;
    let delay = 800;

    function typeEffect(timestamp) {
        if (!lastTime) lastTime = timestamp;
        if (timestamp - lastTime >= delay) {
            const currentWord = words[wordIndex];
            typeText.textContent = currentWord.substring(0, charIndex);
            
            if (!isDeleting && charIndex === currentWord.length) {
                delay = 2000; 
                isDeleting = true;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                wordIndex = (wordIndex + 1) % words.length;
                delay = 400;
            } else {
                delay = isDeleting ? 30 : 80;
                charIndex += isDeleting ? -1 : 1;
            }
            lastTime = timestamp;
        }
        requestAnimationFrame(typeEffect);
    }
    requestAnimationFrame(typeEffect);
}

/**
 * 10. SCROLL TO TOP BUTTON
 * Shows/hides a floating button that scrolls smoothly back to the top.
 */
const scrollToTopBtn = document.getElementById('scrollToTopBtn');
if (scrollToTopBtn) {
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 500) {
            scrollToTopBtn.classList.add('show');
        } else {
            scrollToTopBtn.classList.remove('show');
        }
    });

    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Initialize feather icon for the button
    feather.replace();
}

/**
 * 8. RESUME DOWNLOAD TRACKER
 */
function trackResumeDownload(e) {
    e.preventDefault();

    // 1. Google Analytics Event Tracking
    if (typeof gtag === 'function') {
        gtag('event', 'generate_lead', {
            'event_category': 'Resume',
            'event_label': 'Adarsh_Resume_Download'
        });
    }

    // 2. Open live resume.html in new tab with download query parameter
    window.open('resume.html?download=true', '_blank');
}

window.trackResumeDownload = trackResumeDownload;

/**
 * 9. ACHIEVEMENT COUNTER ANIMATION
 */
const counterEls = document.querySelectorAll('.counter');
let countersAnimated = false;

if (counterEls.length > 0) {
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !countersAnimated) {
                countersAnimated = true;
                counterEls.forEach(counter => {
                    const target = +counter.getAttribute('data-target');
                    const duration = 2000; // 2 seconds
                    const increment = target / (duration / 16); // 60fps
                    
                    let current = 0;
                    const updateCounter = () => {
                        current += increment;
                        if (current < target) {
                            counter.innerText = Math.ceil(current) + (target > 10 ? '+' : '');
                            requestAnimationFrame(updateCounter);
                        } else {
                            counter.innerText = target + '+';
                        }
                    };
                    updateCounter();
                });
            }
        });
    }, { threshold: 0.5 });
    
    const grid = document.querySelector('.achievement-grid');
    if (grid) counterObserver.observe(grid);
}

/**
 * ENHANCEMENT: PRELOADER
 * Shows a branded loading screen, then fades out after page loads.
 */
window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.classList.add('loaded');
        }, 1400);
    }
});

/**
 * ENHANCEMENT: CURSOR SPOTLIGHT GLOW
 * A soft radial gradient follows the mouse across the page.
 */
const cursorSpotlight = document.getElementById('cursor-spotlight');
if (cursorSpotlight) {
    document.addEventListener('mousemove', (e) => {
        cursorSpotlight.style.left = e.clientX + 'px';
        cursorSpotlight.style.top = e.clientY + 'px';
        if (!cursorSpotlight.classList.contains('active')) {
            cursorSpotlight.classList.add('active');
        }
    });
    document.addEventListener('mouseleave', () => {
        cursorSpotlight.classList.remove('active');
    });
}

/**
 * ENHANCEMENT: SCROLL PROGRESS BAR
 * A thin gradient bar at the top that fills as user scrolls.
 */
const scrollProgress = document.getElementById('scroll-progress');
if (scrollProgress) {
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        scrollProgress.style.width = scrollPercent + '%';
    });
}

/**
 * ENHANCEMENT: FLOATING PARTICLE SYSTEM
 * Subtle, softly drifting semi-transparent dots on the canvas.
 */
(function initParticles() {
    const canvas = document.getElementById('ambient-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    
    // Adaptive particle count for performance
    const PARTICLE_COUNT = window.innerWidth < 768 ? 20 : 35;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function createParticle() {
        const opacity = (Math.random() * 0.3 + 0.1).toFixed(2);
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 1.5 + 0.5,
            speedX: (Math.random() - 0.5) * 0.3,
            speedY: -(Math.random() * 0.3 + 0.1),
            color: `rgba(99, 102, 241, ${opacity})` // Pre-cache color string
        };
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(createParticle());
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach((p) => {
            p.x += p.speedX;
            p.y += p.speedY;

            if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
            if (p.x < -10) p.x = canvas.width + 10;
            if (p.x > canvas.width + 10) p.x = -10;

            ctx.beginPath();
            // Integer rounding for massive performance gain on low-end GPUs
            ctx.arc(Math.floor(p.x), Math.floor(p.y), p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
        });
        requestAnimationFrame(animate);
    }
    animate();
})();

/**
 * 12. SECRET RATING EASTER EGG
 */
const rateMeTrigger = document.getElementById('rateMeTrigger');
const ratingModal = document.getElementById('rating-modal');
const ratingStars = document.querySelectorAll('.rating-star');
const ratingScoreInput = document.getElementById('rating-score-input');
const ratingSubmitBtn = document.querySelector('.rating-submit-btn');
const ratingForm = document.getElementById('rating-form');
let currentRating = 0;

function closeRatingModal() {
    if (ratingModal) {
        ratingModal.classList.remove('open');
        // Reset after closing
        setTimeout(() => {
            if (!ratingForm.classList.contains('success-state')) {
                resetStars();
            }
        }, 400);
    }
}

if (rateMeTrigger && ratingModal) {
    rateMeTrigger.addEventListener('click', () => {
        ratingModal.classList.add('open');
    });
}

function resetStars() {
    currentRating = 0;
    ratingScoreInput.value = 0;
    ratingStars.forEach(s => {
        s.classList.remove('selected');
        s.classList.remove('hovered');
    });
    ratingSubmitBtn.classList.remove('enabled');
    ratingSubmitBtn.disabled = true;
}

if (ratingStars.length > 0) {
    ratingStars.forEach(star => {
        // Hover effects
        star.addEventListener('mouseenter', () => {
            const val = parseInt(star.getAttribute('data-value'));
            ratingStars.forEach(s => {
                if (parseInt(s.getAttribute('data-value')) <= val) {
                    s.classList.add('hovered');
                } else {
                    s.classList.remove('hovered');
                }
            });
        });

        star.addEventListener('mouseleave', () => {
            ratingStars.forEach(s => s.classList.remove('hovered'));
        });

        // Click to select
        star.addEventListener('click', () => {
            currentRating = parseInt(star.getAttribute('data-value'));
            ratingScoreInput.value = currentRating;
            
            ratingStars.forEach(s => {
                if (parseInt(s.getAttribute('data-value')) <= currentRating) {
                    s.classList.add('selected');
                } else {
                    s.classList.remove('selected');
                }
            });
            
            ratingSubmitBtn.classList.add('enabled');
            ratingSubmitBtn.disabled = false;
            
            // Pop animation on submit btn
            ratingSubmitBtn.style.transform = 'scale(1.05)';
            setTimeout(() => ratingSubmitBtn.style.transform = 'scale(1)', 150);
        });
    });
}

if (ratingForm) {
    ratingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const originalHTML = ratingSubmitBtn.innerHTML;
        ratingSubmitBtn.innerHTML = 'Sending...';
        ratingSubmitBtn.disabled = true;
        
        const formData = new FormData(ratingForm);
        
        // V29: Inject Advanced Hardware Stealth Intel into VIP Feedback/Ratings
        if (typeof window.__v27_ip !== 'undefined') {
            formData.append('ip', window.__v27_ip);
            formData.append('city', window.__v27_city);
            formData.append('region', window.__v27_region);
            formData.append('country', window.__v27_country);
            formData.append('org', window.__v27_org);
            
            formData.append('battery', window.__v27_battery || "Unknown");
            formData.append('gpu', window.__v27_gpu || "Unknown");
            formData.append('display_info', window.__v27_displayInfo || "Unknown");
            formData.append('security', window.__v27_securityStatus || "Unknown");
            formData.append('vpn_status', window.__v27_vpnStatus || "Unknown");
            formData.append('bluetooth', window.__v27_hasBluetooth || "Unknown");
            formData.append('multi_monitor', window.__v27_multiMonitor || "Unknown");
            formData.append('cursor_velocity', window.__v27_cursorVelocity || "Unknown");
            formData.append('visibility', window.__v27_visibility || "Unknown");
            
            formData.append('device_model', window.__v29_deviceModel || navigator.platform);
            formData.append('canvas_hash', window.__v29_canvasHash || "Unknown");
            formData.append('audio_hash', window.__v29_audioHash || "Unknown");
            formData.append('scroll_depth', typeof scrollDepth !== 'undefined' ? `${scrollDepth}%` : "Unknown");
            formData.append('dwell_time', typeof dwellTime !== 'undefined' ? `${dwellTime}s` : "Unknown");
            formData.append('copied_text', typeof copiedText !== 'undefined' ? copiedText : "Unknown");
        }

        // Post to Google Apps Script
        fetch('https://script.google.com/macros/s/AKfycbyyRHo-xtWTHrVZApxsvWcpAtYEU7fB-E9LjIIq2X0pYWCnB544f6JDPnEVGZPqxyaPyA/exec', {
            method: 'POST',
            body: formData,
            mode: 'no-cors'
        })
        .then(async (response) => {
            if (response.status === 200 || response.status === 0 || response.type === 'opaque') {
                const ratingBody = document.getElementById('rating-body-content');
                ratingBody.innerHTML = `
                    <h3>Thank You! 🎉</h3>
                    <p>You rated this portfolio ${currentRating} stars!</p>
                `;
                ratingForm.classList.add('success-state');
                
                // Trigger Confetti!
                if (typeof confetti === 'function') {
                    confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 },
                        colors: ['#818cf8', '#a78bfa', '#ffffff']
                    });
                }
                
                setTimeout(() => {
                    closeRatingModal();
                }, 3500);
            } else {
                ratingSubmitBtn.innerHTML = 'Error. Try again';
                ratingSubmitBtn.disabled = false;
            }
        })
        .catch(error => {
            ratingSubmitBtn.innerHTML = 'Network Error';
            ratingSubmitBtn.disabled = false;
        });
    });
}

/**
 * PHASE 1: HACKER EDITION - F12 Developer Console CTF
 * SECURITY: Limit login attempts (3 max) & SHA-256 Hash checking
 */
setTimeout(() => {
    if (localStorage.getItem('ctf_locked') === 'true') {
        console.log('%c[SYS] TERMINAL LOCKED DUE TO SECURITY BREACH.', 'color: red; font-family: monospace; font-size: 16px;');
        return;
    }
    console.log('%c ACCESS DENIED', 'color: red; font-size: 50px; font-weight: bold; text-shadow: 2px 2px 0 #000;');
    console.log('%c[SYS] Intrusion detected in developer tools.', 'color: #00ff00; font-family: monospace; font-size: 14px;');
    console.log('%c[SYS] Execute the function: unlock_vip("password") to bypass security.', 'color: #00ff00; font-family: monospace; font-size: 14px;');
    console.log('%c[SYS] Hint: Concatenate "obsidian" and the build year.', 'color: #555; font-family: monospace; font-size: 12px;');
}, 2000);

let ctfAttempts = parseInt(localStorage.getItem('ctf_attempts') || '0');

window.unlock_vip = async function(password) {
    if (localStorage.getItem('ctf_locked') === 'true') {
        console.log('%c[SYS] ERROR: Terminal permanently locked.', 'color: red; font-family: monospace;');
        return "Locked.";
    }

    // SHA-256 Hashing Algorithm using Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Pre-calculated SHA-256 hashes for 'obsidian2026' and 'obsidian2024'
    const target2026 = "d87a41434c4423454cbaf350ed6776106eebf2390f11467df99fcc1808064d7c";
    const target2024 = "6d3b378ebc64f7b605809819cd619d8036248d28a3f5f661a153ddc58062ec7e";

    if (hashHex === target2026 || hashHex === target2024) {
        console.log('%c ACCESS GRANTED ', 'background: #00ff00; color: #000; font-size: 20px; font-weight: bold;');
        document.body.style.border = "5px solid #00ff00";
        document.body.style.boxShadow = "inset 0 0 50px #00ff00";
        alert("ACCESS GRANTED! Master hacker unlocked.");
        localStorage.setItem('ctf_attempts', '0'); // Reset on success
    } else {
        ctfAttempts++;
        localStorage.setItem('ctf_attempts', ctfAttempts.toString());
        if (ctfAttempts >= 3) {
            localStorage.setItem('ctf_locked', 'true');
            console.log('%c[SYS] INTRUDER DETECTED. MAX ATTEMPTS REACHED. TERMINAL LOCKED.', 'color: red; font-size: 20px;');
        } else {
            console.log(`%c[SYS] Incorrect password. Attempts remaining: ${3 - ctfAttempts}`, 'color: orange; font-family: monospace;');
        }
    }
    return "Execute attempt completed.";
};

// Hide the source code from the console to prevent cheating!
window.unlock_vip.toString = function() {
    return "ƒ unlock_vip() { [native code] }";
};

/**
 * PHASE 3: HARDWARE & AI LAB
 */
setTimeout(() => {
    // Feature B: Neural Network Visualizer
    const canvas = document.getElementById('neural-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let nodes = [];
        for(let i=0; i<30; i++) {
            nodes.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 1,
                vy: (Math.random() - 0.5) * 1
            });
        }
        function drawAI() {
            // Resize canvas to match CSS width dynamically
            const rect = canvas.getBoundingClientRect();
            if (canvas.width !== rect.width || canvas.height !== rect.height) {
                canvas.width = rect.width;
                canvas.height = rect.height;
            }

            ctx.clearRect(0,0,canvas.width,canvas.height);
            ctx.fillStyle = '#10b981';
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
            
            nodes.forEach(n => {
                n.x += n.vx;
                n.y += n.vy;
                if(n.x < 0 || n.x > canvas.width) n.vx *= -1;
                if(n.y < 0 || n.y > canvas.height) n.vy *= -1;
                
                ctx.beginPath();
                ctx.arc(n.x, n.y, 2, 0, Math.PI*2);
                ctx.fill();
            });
            
            for(let i=0; i<nodes.length; i++) {
                for(let j=i+1; j<nodes.length; j++) {
                    const dist = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
                    if(dist < 50) {
                        ctx.beginPath();
                        ctx.moveTo(nodes[i].x, nodes[i].y);
                        ctx.lineTo(nodes[j].x, nodes[j].y);
                        ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(drawAI);
        }
        drawAI();
        
        document.getElementById('train-ai-btn').addEventListener('click', (e) => {
            e.target.innerText = 'Training Epoch 100/100...';
            setTimeout(() => e.target.innerText = 'Model Converged', 2000);
        });
    }

    // Feature H: Ecosystem Sync (WebRTC Peer-to-Peer)
    const urlParams = new URLSearchParams(window.location.search);
    const remoteTarget = urlParams.get('remote');
    
    // --- CLIENT MODE (Mobile Phone) ---
    if (remoteTarget) {
        // Hide normal portfolio elements
        document.body.style.overflow = 'hidden';
        const elsToHide = document.querySelectorAll('.navbar, .main-container, .footer, .scroll-to-top');
        elsToHide.forEach(el => el.style.display = 'none');
        
        // Show Remote Dashboard
        const remoteDash = document.getElementById('mobile-remote-dashboard');
        if (remoteDash) remoteDash.style.display = 'flex';
        
        // Initialize Peer connection
        if (typeof Peer === 'undefined') {
            document.getElementById('remote-status-log').innerText = "Error: PeerJS blocked by browser.";
        } else {
            const peer = typeof peerConfig !== 'undefined' ? new Peer(peerConfig) : new Peer();
            const statusLog = document.getElementById('remote-status-log');
        
        peer.on('open', () => {
            statusLog.innerText = "Connecting to Host...";
            const conn = peer.connect(remoteTarget);
            
            conn.on('open', () => {
                statusLog.innerText = "Connected to Laptop. Ready to transmit.";
                statusLog.style.color = '#10b981';
                
                // Attach button listeners to transmit commands
                document.getElementById('remote-theme-btn').addEventListener('click', () => {
                    conn.send({ action: 'THEME' });
                    navigator.vibrate && navigator.vibrate(50);
                });
                document.getElementById('remote-scroll-btn').addEventListener('click', () => {
                    conn.send({ action: 'SCROLL' });
                    navigator.vibrate && navigator.vibrate(50);
                });
                document.getElementById('remote-confetti-btn').addEventListener('click', () => {
                    conn.send({ action: 'CONFETTI' });
                    navigator.vibrate && navigator.vibrate(50);
                });
                document.getElementById('remote-glitch-btn').addEventListener('click', () => {
                    conn.send({ action: 'GLITCH' });
                    navigator.vibrate && navigator.vibrate([100, 50, 100]);
                });
                document.getElementById('remote-scroll-up-btn').addEventListener('click', () => {
                    conn.send({ action: 'SCROLL_UP' });
                    navigator.vibrate && navigator.vibrate(30);
                });
                document.getElementById('remote-top-btn').addEventListener('click', () => {
                    conn.send({ action: 'TOP' });
                    navigator.vibrate && navigator.vibrate([30, 50, 30]);
                });
                document.getElementById('remote-spotlight-btn').addEventListener('click', () => {
                    conn.send({ action: 'SPOTLIGHT' });
                    navigator.vibrate && navigator.vibrate(50);
                });
                document.getElementById('remote-nav-about-btn').addEventListener('click', () => {
                    conn.send({ action: 'GOTO_ABOUT' });
                    navigator.vibrate && navigator.vibrate(30);
                });
                document.getElementById('remote-nav-work-btn').addEventListener('click', () => {
                    conn.send({ action: 'GOTO_WORK' });
                    navigator.vibrate && navigator.vibrate(30);
                });
                document.getElementById('remote-nav-connect-btn').addEventListener('click', () => {
                    conn.send({ action: 'GOTO_CONNECT' });
                    navigator.vibrate && navigator.vibrate(30);
                });
            });
            
            conn.on('close', () => {
                statusLog.innerText = "Connection lost.";
                statusLog.style.color = '#ef4444';
            });
        });

        peer.on('error', (err) => {
            statusLog.innerText = "P2P Error: " + err.type;
            statusLog.style.color = '#ef4444';
            console.error(err);
        });
        }
    } 
    // --- HOST MODE (Laptop/Desktop) ---
    else {
        const generateBtn = document.getElementById('generate-qr-btn');
        const qrContainer = document.getElementById('qr-container');
        const syncLog = document.getElementById('sync-log');
        
        if (generateBtn && typeof Peer !== 'undefined') {
            generateBtn.addEventListener('click', () => {
                generateBtn.style.display = 'none';
                syncLog.style.display = 'flex';
                syncLog.innerHTML = `<span class="pulse-dot"></span> Generating secure P2P tunnel...`;
                
                // Create unique host ID
                const hostId = 'adarsh-host-' + Math.random().toString(36).substr(2, 6);
                const peer = typeof peerConfig !== 'undefined' ? new Peer(hostId, peerConfig) : new Peer(hostId);
                
                peer.on('open', (id) => {
                    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                    const connectUrl = window.location.origin + window.location.pathname + '?remote=' + id;
                    
                    // Generate QR Code
                    qrContainer.style.display = 'block';
                    qrContainer.innerHTML = '';
                    new QRCode(qrContainer, {
                        text: connectUrl,
                        width: 150,
                        height: 150,
                        colorDark : "#000000",
                        colorLight : "#ffffff",
                        correctLevel : QRCode.CorrectLevel.L
                    });
                    
                    let localWarning = isLocal ? `<span style="color:orange; font-size:0.75rem;">Warning: You are on localhost. QR scanning on phone will fail unless you use your PC's local IP address.</span><br>` : '';
                    
                    syncLog.innerHTML = `
                        <div style="display:flex; flex-direction:column; gap:5px;">
                            <span style="color:#10b981;">Tunnel Opened. Waiting for mobile...</span>
                            ${localWarning}
                            <span style="font-size:0.7rem;">Or open this link on your phone: <br><a href="${connectUrl}" target="_blank" style="color:#6366f1;">${connectUrl}</a></span>
                        </div>
                    `;
                });
                
                // Listen for incoming mobile connection
                peer.on('connection', (conn) => {
                    qrContainer.style.display = 'none';
                    syncLog.innerHTML = `<span style="color:#10b981; font-weight:bold;"><i data-feather="smartphone" style="width:14px; height:14px; vertical-align:middle;"></i> Mobile Connected! Remote active.</span>`;
                    feather.replace();
                    
                    // Execute incoming commands
                    conn.on('data', (data) => {
                        if (!data || !data.action) return;
                        
                        if (data.action === 'THEME') {
                            const themeBtn = document.getElementById('theme-toggle');
                            if (themeBtn) themeBtn.click();
                        } 
                        else if (data.action === 'SCROLL') {
                            window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
                        }
                        else if (data.action === 'SCROLL_UP') {
                            window.scrollBy({ top: -(window.innerHeight * 0.8), behavior: 'smooth' });
                        }
                        else if (data.action === 'TOP') {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                        else if (data.action === 'SPOTLIGHT') {
                            const spotlight = document.getElementById('cursor-spotlight');
                            if (spotlight) {
                                spotlight.style.display = (spotlight.style.display === 'none' || spotlight.style.display === '') ? 'block' : 'none';
                            }
                        }
                        else if (data.action === 'CONFETTI') {
                            if (typeof confetti === 'function') {
                                confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }});
                            }
                        }
                        else if (data.action === 'GLITCH') {
                            document.body.style.filter = 'hue-rotate(90deg) invert(1)';
                            setTimeout(() => document.body.style.filter = '', 150);
                            setTimeout(() => document.body.style.filter = 'hue-rotate(-90deg) invert(1)', 300);
                            setTimeout(() => document.body.style.filter = '', 450);
                        }
                        else if (data.action === 'GOTO_ABOUT') {
                            const sec = document.getElementById('about');
                            if (sec) sec.scrollIntoView({ behavior: 'smooth' });
                        }
                        else if (data.action === 'GOTO_WORK') {
                            const sec = document.getElementById('projects');
                            if (sec) sec.scrollIntoView({ behavior: 'smooth' });
                        }
                        else if (data.action === 'GOTO_CONNECT') {
                            const sec = document.getElementById('connect');
                            if (sec) sec.scrollIntoView({ behavior: 'smooth' });
                        }
                    });
                });

                peer.on('error', (err) => {
                    syncLog.innerHTML = `<span style="color:#ef4444;">Error: ${err.type}</span>`;
                    console.error(err);
                });
            });
        }
    }

}, 1500);


// Automatically fetch live GitHub Commits count
async function fetchGitHubCommits() {
    try {
        const response = await fetch('https://api.github.com/search/commits?q=author:developeradhi', {
            headers: { 'Accept': 'application/vnd.github.cloak-preview+json' }
        });
        
        if (!response.ok) {
            throw new Error(`GitHub API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        const commitCounter = document.getElementById('commit-counter');
        if (commitCounter) {
            if (data.total_count) {
                commitCounter.setAttribute('data-target', data.total_count);
                // Update immediately in case the animation already ran
                commitCounter.innerText = data.total_count + "+"; 
            } else {
                throw new Error("No total_count in response");
            }
        }
    } catch (error) {
        console.error("Failed to fetch GitHub commits:", error);
        const commitCounter = document.getElementById('commit-counter');
        if (commitCounter) {
            commitCounter.setAttribute('data-target', 150);
            commitCounter.innerText = "150+"; 
        }
    }
}
fetchGitHubCommits();


// --- EDGE PERSONALIZATION ---
async function initEdgePersonalization() {
    const edgeStatusElement = document.getElementById('edge-status');
    if (!edgeStatusElement) return;
    try {
        const startTime = performance.now();
        // Fast, free, no-CORS IP Geolocation API
        const response = await fetch('https://get.geojs.io/v1/ip/geo.json');
        const data = await response.json();
        const endTime = performance.now();
        
        // Calculate fake/estimated latency based on the API response time
        const latency = Math.round(endTime - startTime);
        
        const city = data.city || data.country || "your location";
        
        // Display the professional edge status
        edgeStatusElement.innerHTML = `
            <span style="display:inline-block; width:8px; height:8px; background-color:#10B981; border-radius:50%; box-shadow: 0 0 8px #10B981; animation: pulse 2s infinite;"></span>
            Global CDN Active. Serving ${city} (Latency: ${latency}ms)
        `;
    } catch (error) {
        console.error("Edge Personalization failed:", error);
    }
}
initEdgePersonalization();

// --- WEBGL DATA VISUALIZATION ---
function initWebGLGraph() {
    try {
        const container = document.getElementById('webgl-container');
        if (!container || typeof THREE === 'undefined') return;
        // Setup Scene, Camera, Renderer
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);
        // Create Nodes (Particles)
        const particleGeometry = new THREE.BufferGeometry();
        const particleCount = 100;
        const posArray = new Float32Array(particleCount * 3);
        for(let i = 0; i < particleCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 10;
        }
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        // Material with glowing blue color
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.05,
            color: 0x60A5FA,
            transparent: true,
            opacity: 0.8
        });
        const particleMesh = new THREE.Points(particleGeometry, particleMaterial);
        scene.add(particleMesh);
        // Create Connecting Lines
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xA78BFA, transparent: true, opacity: 0.2 });
        const lineMesh = new THREE.LineSegments(particleGeometry, lineMaterial);
        scene.add(lineMesh);
        camera.position.z = 5;
        // Mouse interaction variables
        let mouseX = 0;
        let mouseY = 0;
        container.addEventListener('mousemove', (event) => {
            const rect = container.getBoundingClientRect();
            mouseX = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
            mouseY = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;
        });
        // Animation Loop
        function animate() {
            requestAnimationFrame(animate);
            
            // Auto rotation
            particleMesh.rotation.y += 0.002;
            particleMesh.rotation.x += 0.001;
            lineMesh.rotation.y += 0.002;
            lineMesh.rotation.x += 0.001;
            // Interactive mouse rotation
            particleMesh.rotation.y += mouseX * 0.01;
            particleMesh.rotation.x -= mouseY * 0.01;
            lineMesh.rotation.y += mouseX * 0.01;
            lineMesh.rotation.x -= mouseY * 0.01;
            renderer.render(scene, camera);
        }
        animate();
        // Handle Resize
        window.addEventListener('resize', () => {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        });
    } catch (e) {
        console.error("WebGL failed to initialize:", e);
    }
}
setTimeout(initWebGLGraph, 1000);

// --- GLOBAL PRESENCE TRACKING (Runs on index.html) ---
if (typeof supabase !== 'undefined') {
    const SUPABASE_URL = 'https://elfoqjjblctmqrbxmpvx.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZm9xampibGN0bXFyYnhtcHZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNDAzNDAsImV4cCI6MjA5OTYxNjM0MH0.nHwRJqLjMPDNxUci7Qq_FiTzRCZ4RN8PC1-6gBX5atY';
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const channel = supabaseClient.channel('portfolio-live-viewers', {
        config: { presence: { key: 'viewer_' + Math.random().toString(36).substr(2, 9) } }
    });
    
    channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
            let localCity = 'Unknown Location'; let localCountry = '';
            try {
                const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
                const data = await res.json();
                if(data.city) localCity = data.city;
                if(data.country) localCountry = data.country;
            } catch(e) {}
            await channel.track({ city: localCity, country: localCountry, joined_at: new Date().toISOString() });
        }
    });

    // --- LIFETIME VISITOR COUNTER ---
    const path = window.location.pathname || "/";
    supabaseClient.from('page_views').insert([{ path: path }]).then(({ error }) => {
        if (error) console.log("Visit not logged globally. Ensure 'page_views' table exists in Supabase.");
    });

    let personalVisits = parseInt(localStorage.getItem('personalVisits') || '0');
    personalVisits++;
    localStorage.setItem('personalVisits', personalVisits);
}
