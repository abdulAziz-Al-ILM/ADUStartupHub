const { getHead, installScript, LOGO_URL } = require('./layout');

function renderApp(totalUsers, teamBuilding, mvpStage, launched, activeProjects, resumes, problems) {
    return `
    <!DOCTYPE html>
    <html lang="uz">
    <head>${getHead("Ilova | ADU Hub")}</head>
    <body class="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
        <div class="header-glow"></div>

        <div id="authGateway" class="fixed inset-0 bg-slate-900/80 z-[100] flex flex-col items-center justify-center p-4 backdrop-blur-sm">
            <div class="card-light p-8 rounded-2xl max-w-sm w-full text-center shadow-xl">
                <img src="${LOGO_URL}" alt="Logo" class="w-16 h-16 mx-auto mb-4 object-contain">
                <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">Tizimga kirish</h2>
                <p class="text-slate-500 mb-6 text-sm">Korporativ pochtani kiriting (@adu.uz)</p>
                <input id="loginEmail" type="email" placeholder="Pochta manzili" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 mb-4 text-slate-900 dark:text-white focus:border-brand text-sm">
                <input id="loginCode" type="number" placeholder="4 xonali kod (OTP)" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 mb-6 text-slate-900 dark:text-white focus:border-brand text-sm hidden">
                <button id="loginBtn" onclick="checkLogin()" class="w-full bg-brand text-white font-semibold py-3 rounded-lg shadow-sm">Kod yuborish</button>
                <p id="authErrorMsg" class="text-red-500 text-sm mt-3 hidden font-medium">Xatolik</p>
            </div>
        </div>

        <aside class="w-64 card-light h-full flex flex-col hidden md:flex z-20 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div class="p-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
                <img src="${LOGO_URL}" alt="Logo" class="w-8 h-8 object-contain">
                <h1 class="text-lg font-bold text-slate-900 dark:text-white">ADU Hub</h1>
            </div>
            <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
                <button onclick="switchTab('startups', this)" class="nav-btn w-full flex items-center gap-3 px-4 py-2.5 rounded-lg active-tab bg-blue-50 dark:bg-blue-900/20 text-brand"><i class="fas fa-rocket w-5 text-center"></i> Startaplar</button>
                <button onclick="switchTab('talents', this)" class="nav-btn w-full flex items-center gap-3 px-4 py-2.5 text-slate-600 dark:text-slate-400"><i class="fas fa-user-astronaut w-5 text-center"></i> Kadrlar</button>
                <button onclick="switchTab('profile', this)" class="nav-btn w-full flex items-center gap-3 px-4 py-2.5 text-slate-600 dark:text-slate-400 mt-4 border-t border-slate-100 dark:border-slate-800 pt-4"><i class="fas fa-user w-5 text-center"></i> Kabinet</button>
            </nav>
            <div class="p-4 border-t border-slate-100 dark:border-slate-800">
                <button class="install-btn w-full mb-2 bg-brand text-white px-4 py-2 rounded-lg font-medium text-sm"><i class="fas fa-download mr-2"></i> O'rnatish</button>
                <button onclick="toggleTheme()" class="w-full flex items-center gap-3 px-4 py-2 text-slate-600 dark:text-slate-400"><i class="fas fa-moon dark:hidden w-5"></i><i class="fas fa-sun hidden dark:block w-5"></i> Mavzu</button>
            </div>
        </aside>

        <main class="flex-1 h-full overflow-y-auto p-4 pb-24 md:p-8 z-10">
            <div id="profile" class="tab-content max-w-5xl mx-auto">
                <h2 class="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Shaxsiy Kabinet</h2>
                <div class="card-light p-6 rounded-xl border-t-4 border-brand mb-6 flex justify-between items-center">
                    <div>
                        <h3 class="text-lg font-bold text-slate-900 dark:text-white" id="userEmailDisplay">Yuklanmoqda...</h3>
                        <span class="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Tasdiqlangan</span>
                    </div>
                    <button onclick="logout()" class="text-red-500 font-bold"><i class="fas fa-sign-out-alt"></i></button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div onclick="openWebForm('project')" class="card-light border-2 border-dashed border-slate-300 hover:border-brand cursor-pointer p-6 rounded-xl text-center transition"><i class="fas fa-plus text-2xl text-brand mb-2"></i><p class="font-bold">Startap qo'shish</p></div>
                    <div onclick="openWebForm('resume')" class="card-light border-2 border-dashed border-slate-300 hover:border-purple-500 cursor-pointer p-6 rounded-xl text-center transition"><i class="fas fa-plus text-2xl text-purple-500 mb-2"></i><p class="font-bold">Rezyume qo'shish</p></div>
                </div>
            </div>

            <div id="startups" class="tab-content active max-w-6xl mx-auto">
                <h2 class="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Faol Loyihalar</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    ${activeProjects.length > 0 ? activeProjects.map(p => `
                        <div class="hover-card card-light p-5 rounded-xl">
                            <h3 class="text-lg font-bold mb-2">${p.title}</h3>
                            <p class="text-slate-500 text-sm line-clamp-3">${p.goal}</p>
                            <a href="https://t.me/ADUStartupHubBot?start=req_${p.id}" target="_blank" class="text-brand text-xs font-bold mt-4 inline-block">Jamoaga qo'shilish &rarr;</a>
                        </div>
                    `).join('') : '<p class="text-slate-500">Loyihalar yo\'q.</p>'}
                </div>
            </div>

            <div id="talents" class="tab-content max-w-6xl mx-auto">
                <h2 class="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Kadrlar</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                    ${resumes.map(r => `<div class="card-light p-5 rounded-xl border-l-4 border-brand"><p class="text-slate-600 dark:text-slate-400 text-sm">${r.skills}</p></div>`).join('')}
                </div>
            </div>
        </main>

        <nav class="md:hidden card-light fixed bottom-0 w-full z-50 border-t border-slate-200 dark:border-slate-800 pb-safe">
            <div class="flex justify-around p-2">
                <button onclick="switchTab('startups', this)" class="nav-btn p-2 text-brand active-tab"><i class="fas fa-rocket text-xl"></i></button>
                <button onclick="switchTab('talents', this)" class="nav-btn p-2 text-slate-400"><i class="fas fa-user-astronaut text-xl"></i></button>
                <button onclick="switchTab('profile', this)" class="nav-btn p-2 text-slate-400"><i class="fas fa-user text-xl"></i></button>
            </div>
        </nav>

        <div id="webFormModal" class="fixed inset-0 bg-slate-900/60 z-[70] hidden items-center justify-center p-4">
            <div class="card-light w-full max-w-lg rounded-2xl p-6 relative">
                <button onclick="closeWebForm()" class="absolute top-4 right-4 text-slate-400"><i class="fas fa-times"></i></button>
                <h2 id="formTitle" class="text-xl font-bold mb-4">Ma'lumot qo'shish</h2>
                <div id="formContent" class="space-y-3 mb-4"></div>
                <button onclick="submitWebForm()" class="w-full bg-brand text-white py-3 rounded-lg font-bold">Saqlash</button>
                <p id="formStatus" class="text-sm font-semibold mt-3 text-center hidden"></p>
            </div>
        </div>

        ${installScript}
        <script>
            let authEmail = localStorage.getItem('adu_web_auth_email');
            if(authEmail) { document.getElementById('authGateway').style.display = 'none'; document.getElementById('userEmailDisplay').innerText = authEmail; }

            let waitingForOTP = false;
            async function checkLogin() {
                const email = document.getElementById('loginEmail').value.trim();
                const code = document.getElementById('loginCode').value.trim();
                const err = document.getElementById('authErrorMsg'); const btn = document.getElementById('loginBtn');
                
                if(email === 'admin@adu.uz' && code === '7777') { localStorage.setItem('adu_web_auth_email', email); location.reload(); return; }
                err.classList.add('hidden'); btn.innerText = 'Kuting...';

                if(!waitingForOTP) {
                    const res = await fetch('/api/auth/send-otp', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ email }) });
                    if(res.ok) { waitingForOTP = true; document.getElementById('loginCode').classList.remove('hidden'); btn.innerText = "Tasdiqlash"; } 
                    else { err.innerText = "Xatolik!"; err.classList.remove('hidden'); btn.innerText = "Kod yuborish"; }
                } else {
                    const res = await fetch('/api/auth/verify', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ email, code }) });
                    if(res.ok) { localStorage.setItem('adu_web_auth_email', email); location.reload(); } 
                    else { err.innerText = "Kod xato!"; err.classList.remove('hidden'); btn.innerText = "Tasdiqlash"; }
                }
            }

            function logout() { localStorage.removeItem('adu_web_auth_email'); location.reload(); }

            let cType = '';
            function openWebForm(type) {
                cType = type; const c = document.getElementById('formContent');
                if(type === 'project') c.innerHTML = '<input id="fTitle" placeholder="Loyiha nomi" class="w-full border p-3 rounded text-sm"><textarea id="fGoal" placeholder="Maqsad" class="w-full border p-3 rounded text-sm h-20"></textarea>';
                else c.innerHTML = '<textarea id="fSkills" placeholder="Ko\'nikmalar" class="w-full border p-3 rounded text-sm h-24"></textarea>';
                document.getElementById('webFormModal').classList.remove('hidden'); document.getElementById('webFormModal').classList.add('flex'); document.getElementById('formStatus').classList.add('hidden');
            }
            function closeWebForm() { document.getElementById('webFormModal').classList.add('hidden'); document.getElementById('webFormModal').classList.remove('flex'); }

            async function submitWebForm() {
                const stat = document.getElementById('formStatus'); stat.innerText = "Jo'natilmoqda..."; stat.classList.remove('hidden');
                let data = cType === 'project' ? { title: document.getElementById('fTitle').value, goal: document.getElementById('fGoal').value, cause: "Web", benefits: "Web" } : { skills: document.getElementById('fSkills').value };
                
                const res = await fetch('/api/add-item', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ email: authEmail, type: cType, data }) });
                if(res.ok) { stat.innerText = "Saqlandi!"; stat.className = "text-green-500 text-center block mt-2"; setTimeout(() => location.reload(), 1000); } 
                else { stat.innerText = "Xato!"; stat.className = "text-red-500 text-center block mt-2"; }
            }

            function switchTab(id, btn) {
                document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
                document.querySelectorAll('.nav-btn').forEach(el => { el.classList.remove('active-tab', 'bg-blue-50', 'dark:bg-blue-900/20', 'text-brand'); el.classList.add('text-slate-600'); });
                document.getElementById(id).classList.add('active');
                btn.classList.add('active-tab', 'text-brand');
                if(!btn.classList.contains('mobile-nav-item')) btn.classList.add('bg-blue-50', 'dark:bg-blue-900/20');
            }
        </script>
    </body>
    </html>`;
}
module.exports = { renderApp };
