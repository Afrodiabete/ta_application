// ==========================================
// STUDENT CONTROLLER
// ==========================================
const StudentController = {
    state: {
        step: 0, // 0:Ready, 1:Basic, 2:Background, 3:Application
        data: {
            firstName: CURRENT_STUDENT.firstName || '',
            lastName: CURRENT_STUDENT.lastName || '',
            email: CURRENT_STUDENT.email || '',
            department: CURRENT_STUDENT.department || '',
            degree: CURRENT_STUDENT.degree || '',
            resume: '',
            resumeFile: null,
            teachingExperienceBool: CURRENT_STUDENT.teachingExperienceBool || 'No',
            teachingExperienceText: CURRENT_STUDENT.teachingExperienceText || '',
            campus: CURRENT_STUDENT.campus || '',
            courseID: '',
            studentID: '',
            year: '',
            catD: '',
            level: '',
            courseTaken: '',
            knowledgeLevel: '',
            courseKnowledge: '',
            skills: {}
        }
    },

    render(container) {
        const steps = ["Start", "Basic Info", "Background", "TA Application"];

        const filterCourses = (type) => {
            const select = document.getElementById('std-course');
            if (!select) return;
            const opts = COURSES.map(c => {
                if (type === 'All' || c.id.startsWith(type)) return `<option value="${c.id}">${c.id} - ${c.title}</option>`;
                return '';
            }).join('');
            select.innerHTML = `<option disabled selected>Pick a course</option>` + opts;
            if (select.options.length === 1) select.innerHTML += `<option disabled>No courses found</option>`;
        };

        const renderSkills = (courseId) => {
            const skillsContainer = document.getElementById('std-skills-container');
            if (!skillsContainer) return;
            skillsContainer.innerHTML = '';

            const skills = COURSE_SKILLS[courseId] || [];
            if (skills.length === 0) {
                skillsContainer.innerHTML = '<p class="text-sm text-gray-500 italic">No specific skills listed for this course.</p>';
                return;
            }

            skills.forEach(skill => {
                const val = this.state.data.skills[skill.id] || '';
                const div = document.createElement('div');
                div.className = "form-control w-full";
                div.innerHTML = `
                    <label class="label">
                        <span class="label-text font-semibold">${skill.name} (1-5) <span class="text-error">*</span></span>
                    </label>
                    <select class="select select-bordered w-full skill-select" data-cat-id="${skill.id}">
                        <option value="" disabled ${val === '' ? 'selected' : ''}>Select Level</option>
                        <option value="1" ${val === '1' ? 'selected' : ''}>1</option>
                        <option value="2" ${val === '2' ? 'selected' : ''}>2</option>
                        <option value="3" ${val === '3' ? 'selected' : ''}>3</option>
                        <option value="4" ${val === '4' ? 'selected' : ''}>4</option>
                        <option value="5" ${val === '5' ? 'selected' : ''}>5</option>
                    </select>
                `;
                skillsContainer.appendChild(div);

                const sel = div.querySelector('select');
                sel.onchange = (e) => {
                    this.state.data.skills[skill.id] = e.target.value;
                    validate();
                };
            });
        };

        let content = '';
        if (this.state.step === 0) {
            content = `
                <div class="prose max-w-none text-sm text-gray-700 space-y-4">
                    <p>
                      If you want to apply for a Teaching Assistant (TA) position at Purdue Polytechnic
                      Institute in the 2026 Spring/Fall semester and are a Purdue graduate student, please
                      complete this application.
                    </p>
                    <ul class="list-disc ml-5 space-y-1">
                      <li>TA positions are 20 hours/week with tuition support and stipend.</li>
                      <li>
                        English proficiency required (e.g., TOEFL iBT Speaking ≥ 18(or new TOEFL 3.5), IELTS Speaking ≥ 8.0, or
                        TA a course and at same time taking the OEPT course).
                      </li>
                    </ul>
                    <div class="mt-6">
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" id="std-agree" class="checkbox checkbox-primary checkbox-sm" />
                            <span class="text-sm font-medium">I meet the requirements and am ready to begin.</span>
                        </label>
                    </div>
                </div>
            `;
        } else if (this.state.step === 1) {
            content = `
                <div class="grid gap-6 max-w-lg">
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text font-semibold">Full Name <span class="text-error">*</span></span>
                        </label>
                        <div class="flex gap-4">
                            <input type="text" placeholder="First Name" class="input input-bordered w-1/2" id="std-fname" value="${this.state.data.firstName}">
                            <input type="text" placeholder="Last Name" class="input input-bordered w-1/2" id="std-lname" value="${this.state.data.lastName}">
                        </div>
                    </div>
                    
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text font-semibold">Purdue Email Address <span class="text-error">*</span></span>
                        </label>
                        <input type="email" placeholder="email@purdue.edu" class="input input-bordered w-full" id="std-email" value="${this.state.data.email}">
                        <label class="label">
                            <span class="label-text-alt" id="std-email-hint">Your Purdue email address will be used for all communications.</span>
                        </label>
                    </div>

                    <div class="form-control">
                        <label class="label">
                            <span class="label-text font-semibold">TA application academic semester <span class="text-error">*</span></span>
                        </label>
                        <select class="select select-bordered w-full" id="std-semester">
                            <option value="2026-SP" ${this.state.data.semester === '2026-SP' ? 'selected' : ''}>Spring 2026</option>
                            <option value="2026-FA" ${this.state.data.semester === '2026-FA' ? 'selected' : ''}>Fall 2026</option>
                        </select>
                    </div>
                </div>
            `;
        } else if (this.state.step === 2) {
            content = `
                <div class="alert alert-warning shadow-sm mb-6 text-sm">
                     The content on this page can be edited. The latest changes will be saved automatically after you go to the next page.
                </div>

                <div class="grid md:grid-cols-2 gap-6">
                    <!-- Degree -->
                    <div class="form-control w-full">
                        <label class="label">
                            <span class="label-text font-semibold">Degree <span class="text-error">*</span></span>
                        </label>
                        <select class="select select-bordered w-full" id="std-degree">
                            <option disabled ${!this.state.data.degree ? 'selected' : ''}>Select Degree</option>
                            <option value="MS" ${this.state.data.degree === 'MS' ? 'selected' : ''}>MS</option>
                            <option value="PhD" ${this.state.data.degree === 'PhD' ? 'selected' : ''}>PhD</option>
                        </select>
                    </div>

                    <!-- Program -->
                    <div class="form-control w-full">
                        <label class="label">
                            <span class="label-text font-semibold">Department <span class="text-error">*</span></span>
                        </label>
                        <select class="select select-bordered w-full" id="std-program">
                            <option disabled ${!this.state.data.department ? 'selected' : ''}>Select Program</option>
                            <option value="ACC" ${this.state.data.department === 'ACC' ? 'selected' : ''}>ACC</option>
                            <option value="Others" ${this.state.data.department === 'Others' ? 'selected' : ''}>Others</option>
                        </select>
                    </div>

                    <!-- Campus -->
                    <div class="form-control w-full">
                        <label class="label">
                            <span class="label-text font-semibold">Location <span class="text-error">*</span></span>
                        </label>
                        <select class="select select-bordered w-full" id="std-campus-bg">
                            <option value="WL" ${this.state.data.campus === 'WL' ? 'selected' : ''}>West Lafayette</option>
                            <option value="Indy" ${this.state.data.campus === 'Indy' ? 'selected' : ''}>Indianapolis</option>
                        </select>
                    </div>

                    <!-- Enrollment Term -->
                    <div class="form-control w-full">
                        <label class="label">
                            <span class="label-text font-semibold">Enrollment term <span class="text-error">*</span></span>
                        </label>
                        <select class="select select-bordered w-full" id="std-enrollment">
                            <option value="2026-SP">Spring 2026</option>
                            <option value="2026-FA">Fall 2026</option>
                        </select>
                    </div>

                    <!-- Teaching Experience -->
                    <div class="form-control w-full">
                        <label class="label">
                            <span class="label-text font-semibold">Teaching experience <span class="text-error">*</span></span>
                        </label>
                        <select class="select select-bordered w-full" id="std-teaching-exp">
                            <option value="No" ${this.state.data.teachingExperienceBool === 'No' ? 'selected' : ''}>No</option>
                            <option value="Yes" ${this.state.data.teachingExperienceBool === 'Yes' ? 'selected' : ''}>Yes</option>
                        </select>
                    </div>

                    <!-- Resume Upload -->
                    <div class="form-control w-full">
                        <label class="label">
                            <span class="label-text font-semibold">Upload resume (PDF) <span class="text-error">*</span></span>
                        </label>
                        <input type="file" id="std-resume" class="file-input file-input-bordered w-full" accept=".pdf" />
                        <label class="label">
                            <span class="label-text-alt text-error">PDF required.</span>
                        </label>
                    </div>
                </div>

                <!-- Experience Description -->
                <div class="form-control w-full mt-4">
                    <label class="label">
                        <span class="label-text font-semibold">If yes, describe teaching experience</span>
                    </label>
                    <textarea id="std-teaching-desc" class="textarea textarea-bordered h-24" placeholder="Describe here...">${this.state.data.teachingExperienceText}</textarea>
                </div>
            `;
        } else if (this.state.step === 3) {
            content = `
                <div class="alert alert-warning shadow-sm mb-6 text-sm">
                    You can update your submitted application through the Select Course dropdown menu. After clicking Submit, the system will save your latest changes.
                </div>

                <div class="space-y-6">
                    <div class="grid md:grid-cols-2 gap-6">
                        <!-- Campus -->
                        <div class="form-control w-full">
                            <label class="label">
                                <span class="label-text font-semibold">Select campus <span class="text-error">*</span></span>
                            </label>
                            <select class="select select-bordered w-full" id="std-app-campus">
                                <option value="WL" selected>West Lafayette</option>
                                <option value="Indy">Indianapolis</option>
                            </select>
                        </div>

                        <!-- Course -->
                        <div class="form-control w-full">
                            <label class="label justify-start gap-3">
                                <span class="label-text font-semibold">Select course <span class="text-error">*</span></span>
                                <div class="join">
                                    <button class="btn btn-xs join-item btn-active btn-filter" data-type="All">All</button>
                                    <button class="btn btn-xs join-item btn-filter" data-type="CGT">CGT</button>
                                    <button class="btn btn-xs join-item btn-filter" data-type="CNIT">CNIT</button>
                                </div>
                            </label>
                            <select id="std-course" class="select select-bordered w-full">
                                <option disabled selected>Pick a course</option>
                                ${COURSES.map(c => {
                const applied = APPLIED_COURSES.includes(c.id) ? ' (applied)' : '';
                return `<option value="${c.id}">${c.id} - ${c.title}${applied}</option>`;
            }).join('')}
                            </select>
                        </div>
                    </div>

                    <!-- Taken Before -->
                     <div class="form-control w-full">
                        <label class="label">
                            <span class="label-text font-semibold">Did you take this course before? <span class="text-error">*</span></span>
                        </label>
                        <select class="select select-bordered w-full" id="std-taken-before">
                            <option>No</option>
                            <option>Yes</option>
                        </select>
                    </div>

                    <!-- Background Knowledge -->
                    <div class="form-control w-full">
                        <label class="label">
                            <span class="label-text font-semibold">Relevant background knowledge <span class="text-error">*</span></span>
                        </label>
                        <textarea id="std-bg" class="textarea textarea-bordered h-24" placeholder="">${this.state.data.courseKnowledge}</textarea>
                        <label class="label">
                            <span class="label-text-alt text-error">Required</span>
                        </label>
                    </div>
                    
                    <!-- Skills Header -->
                    <div>
                         <h3 class="font-semibold text-sm mb-4">Knowledge of software/coding/math</h3>
                         <div id="std-skills-container" class="space-y-4">
                            <p class="text-sm text-gray-500 italic">Select a course to view required skills.</p>
                         </div>
                    </div>
                </div>
            `;

            setTimeout(() => {
                const btns = container.querySelectorAll('.btn-filter');
                btns.forEach(btn => {
                    btn.onclick = (e) => {
                        const type = e.target.dataset.type;
                        filterCourses(type);
                        btns.forEach(b => {
                            if (b.dataset.type === type) b.classList.add('btn-active');
                            else b.classList.remove('btn-active');
                        });
                    };
                });

                const courseSel = document.getElementById('std-course');
                if (courseSel) {
                    courseSel.addEventListener('change', (e) => {
                        const courseId = e.target.value;
                        this.state.data.courseID = courseId;

                        if (PREVIOUS_APPLICATIONS[courseId]) {
                            this.state.data.skills = { ...PREVIOUS_APPLICATIONS[courseId].skills };
                        } else {
                            this.state.data.skills = {};
                        }

                        renderSkills(courseId);
                        validate();
                    });
                    if (this.state.data.courseID && this.state.data.courseID !== "Pick a course") {
                        courseSel.value = this.state.data.courseID;
                        renderSkills(this.state.data.courseID);
                    }
                }
            }, 0);
        }

        // Title & button label
        let boxTitle = 'Ready to apply';
        if (this.state.step === 1) boxTitle = 'Basic Identification';
        if (this.state.step === 2) boxTitle = 'Background';
        if (this.state.step === 3) boxTitle = 'TA Application';

        let nextText = 'Next';
        if (this.state.step === 0) nextText = 'Ready to apply';
        if (this.state.step === 3) nextText = 'Submit Application';

        container.innerHTML = `
            <section class="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                <h2 class="text-lg font-semibold mb-6">${boxTitle}</h2>

                ${content}
                <div class="mt-8 flex justify-between items-center">
                    <div class="w-10">
                        ${this.state.step > 0 ? `<button id="btn-std-back" class="btn btn-ghost">Back</button>` : ''}
                    </div>
                    <button id="btn-std-next" class="btn btn-primary text-white">${nextText}</button>
                </div>
            </section>
        `;

        // Validation
        const validate = () => {
            let isValid = false;
            const step = this.state.step;
            const d = this.state.data;

            if (step === 0) {
                const cb = document.getElementById('std-agree');
                isValid = cb && cb.checked;
            } else if (step === 1) {
                const fnameEl = document.getElementById('std-fname');
                const lnameEl = document.getElementById('std-lname');
                const emailEl = document.getElementById('std-email');
                const semesterEl = document.getElementById('std-semester');

                const f = fnameEl ? fnameEl.value.trim() : '';
                const l = lnameEl ? lnameEl.value.trim() : '';
                const e = emailEl ? emailEl.value.trim() : '';
                const s = semesterEl ? semesterEl.value : '';

                d.firstName = f; d.lastName = l; d.email = e; d.year = s;

                const isEmailValid = e.toLowerCase().endsWith('@purdue.edu');
                if (emailEl) {
                    const emailHint = document.getElementById('std-email-hint');
                    if (e && !isEmailValid) {
                        emailEl.classList.add('input-error');
                        if (emailHint) {
                            emailHint.textContent = 'Email must end with @purdue.edu';
                            emailHint.classList.add('text-error');
                        }
                    } else {
                        emailEl.classList.remove('input-error');
                        if (emailHint) {
                            emailHint.textContent = 'Your Purdue email address will be used for all communications.';
                            emailHint.classList.remove('text-error');
                        }
                    }
                }

                isValid = Boolean(f && l && e && isEmailValid);
            } else if (step === 2) {
                const degreeEl = document.getElementById('std-degree');
                const progEl = document.getElementById('std-program');
                const campEl = document.getElementById('std-campus-bg');
                const enrollEl = document.getElementById('std-enrollment');
                const expEl = document.getElementById('std-teaching-exp');
                const descEl = document.getElementById('std-teaching-desc');
                const fileEl = document.getElementById('std-resume');

                if (degreeEl) d.degree = degreeEl.value;
                if (progEl) d.department = progEl.value;
                if (campEl) d.campus = campEl.value;
                if (enrollEl) d.year = enrollEl.value;
                if (expEl) d.teachingExperienceBool = expEl.value;
                if (descEl) d.teachingExperienceText = descEl.value;
                if (fileEl && fileEl.files.length > 0) {
                    d.resume = fileEl.files[0].name;
                    d.resumeFile = fileEl.files[0];
                }

                const dValid = d.degree && d.degree !== "Select Degree";
                const pValid = d.department && d.department !== "Select Program";
                const fValid = d.resume && d.resume.length > 0;
                isValid = dValid && pValid && fValid;
            } else if (step === 3) {
                const appCampEl = document.getElementById('std-app-campus');
                const courseEl = document.getElementById('std-course');
                const takenEl = document.getElementById('std-taken-before');
                const bgEl = document.getElementById('std-bg');

                if (appCampEl) d.campus = appCampEl.value;
                if (courseEl) d.courseID = courseEl.value;
                if (takenEl) d.courseTaken = takenEl.value;
                if (bgEl) d.courseKnowledge = bgEl.value;

                let skillsValid = true;
                if (d.courseID && d.courseID !== "Pick a course") {
                    const reqSkills = COURSE_SKILLS[d.courseID] || [];
                    for (const s of reqSkills) {
                        if (!d.skills[s.id]) { skillsValid = false; break; }
                    }
                }

                isValid = d.courseID && d.courseID !== "Pick a course" && d.courseKnowledge && d.courseKnowledge.length > 0 && skillsValid;
            }

            const btn = document.getElementById('btn-std-next');
            if (btn) btn.disabled = !isValid;
        };

        const bindValidation = () => {
            const inputs = container.querySelectorAll('input, select, textarea');
            inputs.forEach(el => {
                el.addEventListener('input', validate);
                el.addEventListener('change', validate);
            });
            validate();
        };
        bindValidation();

        if (this.state.step > 0) {
            document.getElementById('btn-std-back').onclick = () => { this.state.step--; App.render(); };
        }

        document.getElementById('btn-std-next').onclick = async () => {
            if (this.state.step === 3) {
                const btn = document.getElementById('btn-std-next');
                const originalText = btn.innerText;
                btn.disabled = true;
                btn.innerText = "Submitting...";

                try {
                    const formData = new FormData();
                    for (const key in this.state.data) {
                        if (key === 'resumeFile') continue;
                        if (key === 'skills') {
                            for (const sk in this.state.data.skills) {
                                formData.append(`skill_${sk}`, this.state.data.skills[sk]);
                            }
                            continue;
                        }
                        formData.append(key, this.state.data[key]);
                    }
                    if (this.state.data.resumeFile) {
                        formData.append('resume', this.state.data.resumeFile);
                    }

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

                    const response = await fetch('/submit_application/', {
                        method: 'POST',
                        body: formData,
                        headers: { 'X-CSRFToken': csrftoken }
                    });

                    if (response.ok) {
                        alert("Application Submitted Successfully!");
                        this.state.step = 0;
                        this.state.data = {
                            email: '', firstName: '', lastName: '', department: '',
                            degree: '', resume: '', teachingExperienceBool: '', teachingExperienceText: '',
                            campus: '', courseID: '', studentID: '', year: '',
                            catD: '', level: '', courseTaken: '', knowledgeLevel: '', courseKnowledge: '',
                            skills: {}
                        };
                    } else {
                        const errText = await response.text();
                        alert("Submission failed: " + errText);
                    }
                } catch (e) {
                    console.error(e);
                    alert("Error submitting application: " + e.message);
                } finally {
                    if (this.state.step === 3) {
                        btn.disabled = false;
                        btn.innerText = originalText;
                    }
                    App.render();
                }
            } else {
                this.state.step++;
                App.render();
            }
        };
    }
};
