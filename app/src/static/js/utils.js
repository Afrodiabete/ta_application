// ==========================================
// SHARED UTILS & DATA
// ==========================================
// Data is injected by Django as window.* globals in dashboard.html
// before this file is loaded.

const NOW = Date.now();
const daysAgo = (n) => new Date(NOW - n * 24 * 60 * 60 * 1000).toISOString();
const fmtDate = (iso) => new Date(iso).toLocaleString();
const sanitizeFileName = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const COURSES             = window.COURSES             || [];
const COURSE_SKILLS       = window.COURSE_SKILLS       || {};
const APPLICANTS          = window.APPLICANTS          || [];
const CURRENT_STUDENT     = window.CURRENT_STUDENT     || {};
const APPLIED_COURSES     = window.APPLIED_COURSES     || [];
const PREVIOUS_APPLICATIONS = window.PREVIOUS_APPLICATIONS || {};
