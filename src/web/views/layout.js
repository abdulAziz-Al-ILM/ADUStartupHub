// Premium 3D Raketa Logotipi
const LOGO_URL = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"; 

const getHead = (title) => `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>${title}</title>
    <link rel="manifest" href="/manifest.json?v=5">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <script>
        tailwind.config = { darkMode: 'class', theme: { extend: { colors: { brand: '#2563eb', brandhover: '#1d4ed8' } } } }
        if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        function toggleTheme() { document.documentElement.classList.toggle('dark'); localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light'); }
    </script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; transition: background-color 0.3s, color 0.3s; -webkit-tap-highlight-color: transparent; }
        body:not(.dark) { background-color: #f8fafc; color: #0f172a; } .card-light { background: #ffffff; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .dark body { background-color: #0f172a; color: #f8fafc; } .dark .card-light { background: #1e293b; border: 1px solid #334155; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .header-glow { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 100vw; height: 40vh; background: radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%); z-index: -1; pointer-events: none; }
        .dark .header-glow { background: radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%); }
        .hover-card { transition: all 0.2s ease; } .hover-card:hover { transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); border-color: #3b82f6; }
        .dark .hover-card:hover { box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3); border-color: #3b82f6; }
        @media (display-mode: standalone) { .install-btn { display: none !important; } }
        .tab-content { display: none; animation: fadeIn 0.3s ease; } .tab-content.active { display: block; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    </style>
`;

const installScript = `
    <script>
        let dp; window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); dp = e; }); 
        function handleInstall() { 
            if(dp) { dp.prompt(); dp.userChoice.then(r => { if(r.outcome === 'accepted') dp = null; }); } 
            else { 
                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
                if(isIOS) alert("Ilovani iPhone'ga o'rnatish:\\n1. Pastdagi 'Ulashish' belgisini bosing.\\n2. 'Ekranga qo'shish' ni tanlang.");
                else alert("Ilova tayyor! Brauzer menyusidan (3 nuqta) 'Ekranga qo'shish' ni bosing."); 
            } 
        } 
        document.querySelectorAll('.install-btn').forEach(b => b.addEventListener('click', handleInstall));
    </script>
`;

module.exports = { getHead, installScript, LOGO_URL };
