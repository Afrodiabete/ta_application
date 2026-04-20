// ==========================================
// FACULTY CONTROLLER
// ==========================================
const FacultyController = {
    state: {
        page: 'courses', // courses | applicants | detail
        courseId: COURSES.length > 0 ? COURSES[0].id : null,
        applicantId: null,
        applicantYear: null,  // tracks which semester's row was clicked
        filter: 'all',
        evalData: { overall: 'Recommend', comments: '' }
    },

    render(container) {
        if (this.state.page === 'courses') this.renderCourses(container);
        else if (this.state.page === 'applicants') this.renderApplicants(container);
        else if (this.state.page === 'detail') this.renderDetail(container);
    },

    renderCourses(container) {
        container.innerHTML = `
            <section class="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                <h2 class="text-lg font-semibold mb-4">Faculty: Select Course</h2>
                <div class="flex gap-4 items-center">
                     <select id="fac-course" class="border rounded-lg px-3 py-2 text-sm w-full md:w-auto">
                        ${COURSES.length > 0
                ? COURSES.map(c => `<option value="${c.id}" ${c.id === this.state.courseId ? 'selected' : ''}>${c.id} — ${c.title}</option>`).join('')
                : '<option disabled selected>No courses assigned</option>'
            }
                    </select>
                    <button id="btn-fac-go" class="btn btn-primary btn-sm text-white" ${COURSES.length === 0 ? 'disabled' : ''}>Go to Applicants</button>
                </div>
            </section>
        `;
        document.getElementById('fac-course').onchange = (e) => { this.state.courseId = e.target.value; };
        document.getElementById('btn-fac-go').onclick = () => { this.state.page = 'applicants'; App.render(); };
    },

    renderApplicants(container) {
        // Build one row per (applicant, semester) pair for this course.
        // Applications are keyed as "courseId__year", so iterate all keys.
        const rows = [];
        for (const a of APPLICANTS) {
            const matchingKeys = Object.keys(a.applications || {}).filter(key =>
                a.applications[key].courseId === this.state.courseId
            );
            for (const key of matchingKeys) {
                const rec = a.applications[key];
                const statusBadge = rec.status === 'evaluated'
                    ? `<span class="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs">Evaluated</span>`
                    : `<span class="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs">New</span>`;
                rows.push(`
                <tr class="odd:bg-white even:bg-gray-50/50">
                    <td class="p-3">${a.name}<br><span class="text-black text-xs">${a.email}</span></td>
                    <td class="p-3">${a.dept} / ${a.degree}</td>
                    <td class="p-3 text-xs">${a.hasTeachingExp === 'Yes' ? '<span class="px-2 py-1 rounded bg-green-100 text-green-800">Yes</span>' : '<span class="px-2 py-1 rounded bg-gray-100 text-gray-600">No</span>'}</td>
                    <td class="p-3">${rec.year}</td>
                    <td class="p-3">${statusBadge}</td>
                    <td class="p-3">
                        <button class="btn btn-xs btn-outline btn-review" data-id="${a.id}" data-year="${rec.year}">Review</button>
                    </td>
                </tr>`);
            }
        }

        container.innerHTML = `
            <section class="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                <header class="flex justify-between items-center mb-4">
                    <h2 class="text-lg font-semibold">Applicants for ${this.state.courseId}</h2>
                    <button id="btn-fac-back" class="text-sm underline">Switch Course</button>
                </header>
                <table class="w-full text-sm text-left">
                    <thead><tr class="bg-gray-100"><th class="p-3">Applicant</th><th class="p-3">Dept/Degree</th><th class="p-3">Teaching Exp</th><th class="p-3">Term</th><th class="p-3">Status</th><th class="p-3">Actions</th></tr></thead>
                    <tbody>${rows.join('') || '<tr><td colspan="6" class="p-4 text-center">No applicants found.</td></tr>'}</tbody>
                </table>
            </section>
        `;
        document.getElementById('btn-fac-back').onclick = () => { this.state.page = 'courses'; App.render(); };
        container.querySelectorAll('.btn-review').forEach(b => {
            b.onclick = (e) => {
                this.state.applicantId = e.target.dataset.id;
                this.state.applicantYear = e.target.dataset.year;
                this.state.page = 'detail';
                App.render();
            };
        });
    },

    renderDetail(container) {
        const a = APPLICANTS.find(x => x.id === this.state.applicantId);
        if (!a) { this.state.page = 'applicants'; App.render(); return; }

        // Find the application record for this specific course + year
        const appKey = `${this.state.courseId}__${this.state.applicantYear}`;
        const appRec = (a.applications || {})[appKey] || {};
        const courseSkills = appRec.skills || [];
        const courseKnowledgeText = appRec.knowledge || '';

        container.innerHTML = `
            <section class="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 space-y-6">
                <div class="flex justify-between items-start">
                    <div>
                        <h2 class="text-xl font-bold">${a.name}</h2>
                        <p class="text-black text-sm">${a.email} • ${a.dept} ${a.degree}</p>
                    </div>
                    <button id="btn-fac-list" class="btn btn-ghost btn-xs">Back to List</button>
                </div>

                <div class="grid md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-xl">
                    <div>
                        <h3 class="font-semibold mb-2">Academic Info</h3>
                        <ul class="text-sm space-y-1">
                            <li><strong>Campus:</strong> West Lafayette</li>
                            <li><strong>Term:</strong> ${this.state.applicantYear || a.term}</li>
                            <li><strong>Teaching Exp:</strong> ${a.hasTeachingExp} (${a.teachingKnowledge})</li>
                            ${courseKnowledgeText ? `<li><strong>Course Knowledge:</strong> ${courseKnowledgeText}</li>` : ''}
                        </ul>
                    </div>
                    <div>
                        <h3 class="font-semibold mb-2">Skills for ${this.state.courseId}</h3>
                        <ul class="text-sm list-disc pl-5">
                            ${courseSkills.length > 0
                                ? courseSkills.map(s => `<li>${s.name} (Level ${s.level})</li>`).join('')
                                : '<li class="text-gray-400">No skill ratings recorded.</li>'}
                        </ul>
                    </div>
                </div>

                <!-- Resume Display Section -->
                ${a.resumeUrl
                ? `<div class="border rounded-xl bg-gray-50 overflow-hidden">
                        <div class="p-3 bg-blue-100 border-b border-blue-200 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 class="font-semibold text-blue-900">Applicant Resume</h3>
                        </div>
                        <iframe src="${a.resumeUrl}" class="w-full" style="height: 600px; border: none;"></iframe>
                      </div>`
                : `<div class="p-4 border rounded-xl bg-gray-50 border-gray-200 text-center">
                        <span class="text-sm text-gray-500 italic">No resume available</span>
                      </div>`
            }

                <div class="pt-4 border-t">
                    <h3 class="font-bold text-lg mb-4">Evaluation Logic</h3>
                    <div class="space-y-4 max-w-lg">
                        <div>
                            <label class="block text-sm font-medium mb-1">Overall Recommendation</label>
                            <select class="select select-bordered w-full" id="eval-rec">
                                <option>Strongly recommend previous TA</option>
                                <option>Strongly Recommend</option>
                                <option>Recommend</option>
                                <option>Neutral</option>
                                <option>Do Not Recommend</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-1">Comments</label>
                            <textarea class="textarea textarea-bordered w-full" id="eval-comment" placeholder="Write your feedback..."></textarea>
                        </div>
                        <button id="btn-fac-submit" class="btn btn-primary text-white">Submit Evaluation</button>
                    </div>
                </div>
            </section>
        `;
        document.getElementById('btn-fac-list').onclick = () => { this.state.page = 'applicants'; App.render(); };
        document.getElementById('btn-fac-submit').onclick = async () => {
            const btn = document.getElementById('btn-fac-submit');
            const originalText = btn.innerText;
            btn.disabled = true;
            btn.innerText = "Submitting...";

            try {
                const rec = document.getElementById('eval-rec').value;
                const comment = document.getElementById('eval-comment').value;

                const formData = new FormData();
                formData.append('applicant_id', a.email);
                formData.append('course_id', this.state.courseId);
                formData.append('year', this.state.applicantYear || a.term || '2026');
                formData.append('overall_recommendation', rec);
                formData.append('comments', comment);

                const getCookie = (name) => {
                    let cookieValue = null;
                    if (document.cookie && document.cookie !== '') {
                        const cookies = document.cookie.split(';');
                        for (let i = 0; i < cookies.length; i++) {
                            const cookie = cookies[i].trim();
                            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                                break;
                            }
                        }
                    }
                    return cookieValue;
                };
                const csrftoken = getCookie('csrftoken');

                const response = await fetch('/submit_faculty_evaluation/', {
                    method: 'POST',
                    body: formData,
                    headers: { 'X-CSRFToken': csrftoken }
                });

                if (response.ok) {
                    alert("Evaluation Submitted Successfully!");
                    // Update local state using the composite key
                    const updKey = `${this.state.courseId}__${this.state.applicantYear}`;
                    if (a.applications[updKey]) {
                        a.applications[updKey].status = 'evaluated';
                        a.applications[updKey].overall = rec;
                        a.applications[updKey].comments = comment;
                    }
                    this.state.page = 'applicants';
                    App.render();
                } else {
                    const errText = await response.text();
                    alert("Submission failed: " + errText);
                }
            } catch (e) {
                console.error(e);
                alert("Error submitting evaluation: " + e.message);
            } finally {
                btn.disabled = false;
                btn.innerText = originalText;
            }
        };
    }
};
