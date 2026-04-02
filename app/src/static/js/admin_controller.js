// ==========================================
// ADMIN CONTROLLER
// ==========================================
const AdminController = {
    state: {
        page: 'home',
        courseId: COURSES.length > 0 ? COURSES[0].id : null,
        homeYear: '',
        homeTerm: 'Spring',
        evaluatedOrderBy: 'overallScore',
        evaluatedFilters: { SR: true, R: true, N: true, NR: true },
        evaluatedDetailId: null,
        pendingSortBy: 'time',
        pendingShowCrossOne: false,
        pendingDetailId: null
    },

    getApplicantsForCourse(courseId) {
        const list = [];
        for (const a of APPLICANTS) {
            const rec = a.applications[courseId];
            if (!rec) continue;

            const termStr = (a.term || "").toUpperCase();
            const filterYear = this.state.homeYear;
            const filterTerm = this.state.homeTerm;

            if (filterYear && !termStr.includes(filterYear)) continue;

            if (filterTerm) {
                const isSpring = filterTerm === 'Spring' && (termStr.includes('SPRING') || termStr.includes('SP'));
                const isFall = filterTerm === 'Fall' && (termStr.includes('FALL') || termStr.includes('FA'));
                if (!isSpring && !isFall) continue;
            }

            list.push({
                ...a,
                course: courseId,
                status: rec.status,
                overall: rec.overall || null,
                overallScore: rec.overallScore ?? null,
                specificScore: rec.specificScore ?? null,
                comments: rec.comments ?? "",
                evaluatedAt: rec.evaluatedAt ?? null,
                knowledge: rec.knowledge || ""
            });
        }
        return list;
    },

    render(container) {
        if (this.state.page === 'home') this.renderHome(container);
        else if (this.state.page === 'evaluated') this.renderEvaluated(container);
        else if (this.state.page === 'pending') this.renderPending(container);
    },

    renderHome(container) {
        const validYear = /^\d{4}$/.test(this.state.homeYear);
        container.innerHTML = `
            <section class="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                <h2 class="text-lg font-semibold mb-4">Administrative Review Evaluation</h2>
                <div class="grid gap-4 md:grid-cols-2">
                    <div class="space-y-2">
                        <div class="text-sm text-black">Select course</div>
                        <select id="adm-course" class="border rounded-lg px-3 py-2 text-sm w-full md:w-auto">
                            ${COURSES.length > 0
                ? COURSES.map(c => `<option value="${c.id}" ${c.id === this.state.courseId ? 'selected' : ''}>${c.id} — ${c.title}</option>`).join('')
                : '<option disabled selected>No courses available</option>'
            }
                        </select>
                    </div>
                    <div class="space-y-2">
                        <div class="text-sm text-black">Select semester</div>
                        <div class="flex gap-2">
                            <input type="text" id="adm-year" value="${this.state.homeYear}" placeholder="Year" maxlength="4" class="border rounded-lg px-3 py-2 text-sm w-24">
                            <select id="adm-term" class="border rounded-lg px-3 py-2 text-sm w-auto">
                                <option ${this.state.homeTerm === 'Spring' ? 'selected' : ''}>Spring</option>
                                <option ${this.state.homeTerm === 'Fall' ? 'selected' : ''}>Fall</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="mt-6 flex flex-wrap gap-3">
                    <button id="btn-adm-pending" class="btn btn-sm btn-primary text-white" ${!validYear ? 'disabled' : ''}>View Applicants Not Evaluated</button>
                    <button id="btn-adm-evaluated" class="btn btn-sm btn-primary text-white" ${!validYear ? 'disabled' : ''}>View Applicants Evaluated</button>
                </div>
            </section>
        `;
        document.getElementById('adm-course').onchange = (e) => { this.state.courseId = e.target.value; App.render(); };
        document.getElementById('adm-term').onchange = (e) => { this.state.homeTerm = e.target.value; };

        const yearInput = document.getElementById('adm-year');
        const btnPending = document.getElementById('btn-adm-pending');
        const btnEvaluated = document.getElementById('btn-adm-evaluated');

        yearInput.oninput = (e) => {
            this.state.homeYear = e.target.value;
            const isValid = /^\d{4}$/.test(this.state.homeYear);
            if (btnPending) btnPending.disabled = !isValid;
            if (btnEvaluated) btnEvaluated.disabled = !isValid;
        };

        if (btnPending) {
            btnPending.onclick = () => {
                if (/^\d{4}$/.test(this.state.homeYear)) {
                    this.state.page = 'pending';
                    App.render();
                }
            };
        }
        if (btnEvaluated) {
            btnEvaluated.onclick = () => {
                if (/^\d{4}$/.test(this.state.homeYear)) {
                    this.state.page = 'evaluated';
                    App.render();
                }
            };
        }
    },

    renderEvaluated(container) {
        const all = this.getApplicantsForCourse(this.state.courseId).filter(a => a.status === 'evaluated');

        const filtered = all.filter(a => {
            let key = 'NR';
            if (a.overall === "Strongly Recommend") key = 'SR';
            else if (a.overall === "Recommend") key = 'R';
            else if (a.overall === "Neutral") key = 'N';
            else if (a.overall === "Do Not Recommend") key = 'NR';
            return this.state.evaluatedFilters[key];
        });

        filtered.sort((a, b) => a.name.localeCompare(b.name));

        const rows = filtered.map(a => {
            const isExpanded = this.state.evaluatedDetailId === a.email;

            const otherCourses = Object.entries(a.applications || {})
                .filter(([cid]) => cid !== this.state.courseId)
                .map(([cid, rec]) => {
                    const statusText = rec.status === 'evaluated' ? (rec.overall || 'Evaluated') : 'Pending';
                    const commentText = rec.comments ? `<br><span class="text-xs text-gray-600 block pl-2 border-l-2 border-gray-300 mt-1">${rec.comments}</span>` : '';
                    return `<div class="mb-2"><strong>${cid}:</strong> ${statusText}${commentText}</div>`;
                })
                .join('') || '<div class="text-gray-500">—</div>';

            const mainRow = `
            <tr class="odd:bg-white even:bg-gray-50/50 border-b">
                <td class="p-3">${a.name}<br><span class="text-black text-xs">${a.email}</span></td>
                <td class="p-3 bg-blue-50 font-medium text-blue-800">${a.overall}</td>
                <td class="p-3 text-sm">${a.knowledge || '—'}</td>
                <td class="p-3 text-xs max-w-xs truncate">${a.comments || "—"}</td>
                <td class="p-3">
                    <button class="btn-detail border rounded px-3 py-1 text-xs hover:bg-gray-100" data-email="${a.email}">
                        Detailed information
                    </button>
                </td>
            </tr>`;

            if (!isExpanded) return mainRow;

            const detailRow = `
            <tr class="bg-blue-50/30">
                <td colspan="5" class="p-4 space-y-4">
                    <div class="grid md:grid-cols-2 gap-6 text-sm">
                        <div class="space-y-2">
                            <div><span class="font-semibold text-blue-900">Name:</span> ${a.name}</div>
                            <div><span class="font-semibold text-blue-900">Email:</span> ${a.email}</div>
                            <div><span class="font-semibold text-blue-900">Department:</span> ${a.dept}</div>
                            <div><span class="font-semibold text-blue-900">Degree:</span> ${a.degree}</div>
                            <div><span class="font-semibold text-blue-900">Experience:</span> ${a.experience}</div>
                        </div>
                        <div>
                            <h4 class="font-semibold text-blue-900 mb-2">Other course evaluation</h4>
                            <div class="space-y-1">${otherCourses}</div>
                        </div>
                    </div>
                    ${a.resumeUrl
                        ? `<div class="border rounded-xl bg-gray-50 overflow-hidden">
                                <div class="p-3 bg-blue-100 border-b border-blue-200 flex items-center justify-between">
                                    <div class="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span class="font-semibold text-blue-900 text-sm">Applicant Resume</span>
                                    </div>
                                    <a href="/download_resume/${a.email}/" target="_blank" class="text-xs text-blue-600 underline hover:text-blue-800">Open in new tab</a>
                                </div>
                                <iframe src="/download_resume/${a.email}/" class="w-full" style="height:600px;border:none;"></iframe>
                           </div>`
                        : `<div class="p-4 border rounded-xl bg-gray-50 text-center text-sm text-gray-500 italic">No resume available</div>`
                    }
                </td>
            </tr>`;

            return mainRow + detailRow;
        }).join('');

        container.innerHTML = `
            <section class="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                <header class="flex justify-between items-center mb-4">
                    <h2 class="text-lg font-semibold">Evaluated Applicants: ${this.state.courseId}</h2>
                    <button id="btn-adm-back" class="text-sm underline">Back</button>
                </header>

                <div class="flex gap-4 mb-4 text-sm p-2 bg-gray-50 rounded text-black">
                    <span class="font-semibold">Filter:</span>
                    <label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" class="checkbox checkbox-xs" value="SR" ${this.state.evaluatedFilters.SR ? 'checked' : ''}> Strongly Rec</label>
                    <label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" class="checkbox checkbox-xs" value="R" ${this.state.evaluatedFilters.R ? 'checked' : ''}> Recommend</label>
                    <label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" class="checkbox checkbox-xs" value="N" ${this.state.evaluatedFilters.N ? 'checked' : ''}> Neutral</label>
                    <label class="flex items-center gap-1 cursor-pointer"><input type="checkbox" class="checkbox checkbox-xs" value="NR" ${this.state.evaluatedFilters.NR ? 'checked' : ''}> Not Rec</label>
                </div>

                <table class="w-full text-sm text-left">
                    <thead><tr class="bg-gray-100"><th class="p-3">Applicant</th><th class="p-3">Result</th><th class="p-3">Knowledge</th><th class="p-3">Comments</th><th class="p-3">Actions</th></tr></thead>
                    <tbody>${rows || '<tr><td colspan="5" class="p-4 text-center text-black">No records found.</td></tr>'}</tbody>
                </table>
            </section>
        `;
        document.getElementById('btn-adm-back').onclick = () => { this.state.page = 'home'; App.render(); };

        container.querySelectorAll('input[type=checkbox]').forEach(cb => {
            cb.onchange = (e) => {
                this.state.evaluatedFilters[e.target.value] = e.target.checked;
                App.render();
            };
        });

        container.querySelectorAll('.btn-detail').forEach(btn => {
            btn.onclick = (e) => {
                const email = e.target.dataset.email;
                this.state.evaluatedDetailId = (this.state.evaluatedDetailId === email) ? null : email;
                App.render();
            };
        });
    },

    renderPending(container) {
        const list = this.getApplicantsForCourse(this.state.courseId).filter(a => a.status !== 'evaluated');

        const rows = list.map(a => {
            const isExpanded = this.state.pendingDetailId === a.email;

            const otherCoursesDetail = Object.entries(a.applications || {})
                .filter(([cid]) => cid !== this.state.courseId)
                .map(([cid, rec]) => {
                    const statusText = rec.status === 'evaluated' ? (rec.overall || 'Evaluated') : 'Pending';
                    const commentText = rec.comments ? `<br><span class="text-xs text-gray-600 block pl-2 border-l-2 border-gray-300 mt-1">${rec.comments}</span>` : '';
                    return `<div class="mb-2"><strong>${cid}:</strong> ${statusText}${commentText}</div>`;
                })
                .join('') || '<div class="text-gray-500">—</div>';

            const otherCoursesSimple = Object.keys(a.applications || {})
                .filter(cid => cid !== this.state.courseId)
                .join(', ');

            const mainRow = `
            <tr class="odd:bg-white even:bg-gray-50/50 border-b">
                <td class="p-3">${a.name}<br><span class="text-black text-xs">${a.email}</span></td>
                <td class="p-3">${a.dept}</td>
                <td class="p-3">${a.degree}</td>
                <td class="p-3 text-xs max-w-xs truncate">${a.knowledge || '—'}</td>
                <td class="p-3 text-xs text-blue-600">${otherCoursesSimple || '—'}</td>
                <td class="p-3">
                    <button class="btn-detail-pending border rounded px-3 py-1 text-xs hover:bg-gray-100" data-email="${a.email}">
                        Detailed information
                    </button>
                </td>
            </tr>`;

            if (!isExpanded) return mainRow;

            const detailRow = `
            <tr class="bg-gray-50/50">
                <td colspan="6" class="p-4 space-y-4">
                    <div class="grid md:grid-cols-2 gap-6 text-sm">
                        <div class="space-y-2">
                            <div><span class="font-semibold text-blue-900">Name:</span> ${a.name}</div>
                            <div><span class="font-semibold text-blue-900">Email:</span> ${a.email}</div>
                            <div><span class="font-semibold text-blue-900">Department:</span> ${a.dept}</div>
                            <div><span class="font-semibold text-blue-900">Degree:</span> ${a.degree}</div>
                            <div><span class="font-semibold text-blue-900">Experience:</span> ${a.experience}</div>
                        </div>
                        <div>
                            <h4 class="font-semibold text-blue-900 mb-2">Other course evaluation</h4>
                            <div class="space-y-1">${otherCoursesDetail}</div>
                        </div>
                    </div>
                    ${a.resumeUrl
                        ? `<div class="border rounded-xl bg-gray-50 overflow-hidden">
                                <div class="p-3 bg-blue-100 border-b border-blue-200 flex items-center justify-between">
                                    <div class="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span class="font-semibold text-blue-900 text-sm">Applicant Resume</span>
                                    </div>
                                    <a href="/download_resume/${a.email}/" target="_blank" class="text-xs text-blue-600 underline hover:text-blue-800">Open in new tab</a>
                                </div>
                                <iframe src="/download_resume/${a.email}/" class="w-full" style="height:600px;border:none;"></iframe>
                           </div>`
                        : `<div class="p-4 border rounded-xl bg-gray-50 text-center text-sm text-gray-500 italic">No resume available</div>`
                    }
                </td>
            </tr>`;

            return mainRow + detailRow;
        }).join('');

        container.innerHTML = `
            <section class="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                <header class="flex justify-between items-center mb-4">
                    <h2 class="text-lg font-semibold">Pending Applicants: ${this.state.courseId}</h2>
                    <button id="btn-adm-back" class="text-sm underline">Back</button>
                </header>
                <table class="w-full text-sm text-left">
                    <thead><tr class="bg-gray-100"><th class="p-3">Applicant</th><th class="p-3">Dept</th><th class="p-3">Degree</th><th class="p-3">Knowledge</th><th class="p-3">Other Courses</th><th class="p-3">Actions</th></tr></thead>
                    <tbody>${rows || '<tr><td colspan="6" class="p-4 text-center text-black">No pending applicants.</td></tr>'}</tbody>
                </table>
            </section>
        `;
        document.getElementById('btn-adm-back').onclick = () => { this.state.page = 'home'; App.render(); };

        container.querySelectorAll('.btn-detail-pending').forEach(btn => {
            btn.onclick = (e) => {
                const email = e.target.dataset.email;
                this.state.pendingDetailId = (this.state.pendingDetailId === email) ? null : email;
                App.render();
            };
        });
    }
};
