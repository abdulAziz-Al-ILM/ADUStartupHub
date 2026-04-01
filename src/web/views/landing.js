const { getHead, installScript, LOGO_URL } = require('./layout');

function renderLanding(totalUsers, activeProjects) {
    return `
    <!DOCTYPE html>
    <html lang="uz">
    <head>${getHead("ADU Startup Hub")}</head>
    <body class="min-h-screen flex flex-col relative">
        <div class="header-glow"></div>
        <nav class="w-full card-light fixed top-0 z-50 px-6 py-4 flex justify-between items-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
            <div class="flex items-center gap-3">
                <img src="${LOGO_URL}" alt="Logo" class="w-8 h-8 object-contain">
                <span class="text-xl font-bold tracking-tight text-slate-900 dark:text-white">ADU Hub</span>
            </div>
            <div class="flex gap-4">
                <button onclick="toggleTheme()" class="text-slate-500"><i class="fas fa-moon dark:hidden"></i><i class="fas fa-sun hidden dark:block"></i></button>
            </div>
        </nav>
        <main class="flex-1 flex flex-col items-center justify-center text-center px-4 pt-32 pb-20 z-10">
            <h1 class="text-5xl md:text-6xl font-extrabold mb-6 leading-tight max-w-3xl mx-auto tracking-tight text-slate-900 dark:text-white">
                Universitet g'oyalarini <span class="text-brand">bozorga aylantiramiz.</span>
            </h1>
            <p class="text-lg text-slate-500 max-w-2xl mb-12">Iqtidorli talabalar, dasturchilar va startap asoschilari uchun yagona korporativ ekotizim.</p>
            <a href="/app" class="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-xl font-semibold transition shadow-lg">Platformaga kirish &rarr;</a>
        </main>
        ${installScript}
    </body>
    </html>`;
}
module.exports = { renderLanding };
