/* ==========================================================
   Site settings. Projects, articles, learning notes and
   experience are NOT edited here: use /admin.html instead
   (they are stored in data/site-data.js).
   ========================================================== */

window.CONFIG = {
  name: "Durojaiye Rofiat Titilayo",
  initials: "RD",
  title: "Cybersecurity Analyst | SOC Analyst",
  email: "teetee.duro@gmail.com",
  phone: "09036480791",
  showPhone: false,                // privacy setting: true = show phone on the live site
  linkedin: "https://www.linkedin.com/in/durojaiye-rofiat-441325220",
  github: "",                      // set from the admin page (Site settings) or here
  resumeUrl: "",                   // e.g. "assets/files/resume.pdf" (button only appears when set)
  /* Contact form: messages are delivered straight to the email above through FormSubmit.
     The FIRST message sent triggers an activation email to that inbox. Click the
     confirm link once and every later message arrives normally. */
  formEndpoint: "https://formsubmit.co/ajax/teetee.duro@gmail.com",
  siteUrl: "",                     // e.g. "https://username.github.io/rofiat-portfolio"
  portrait: "assets/img/portrait.jpg",
  portraitAlt: "Portrait of Durojaiye Rofiat Titilayo, Cybersecurity Analyst"
};

/* Values from data/site-data.js (set in the admin page) override the defaults above. */
if (window.SITE_DATA && window.SITE_DATA.config) {
  Object.keys(window.SITE_DATA.config).forEach(function (k) {
    if (window.SITE_DATA.config[k]) window.CONFIG[k] = window.SITE_DATA.config[k];
  });
}

window.PROJECT_CATEGORIES = ["Incident Investigation", "SOC & Detection", "Cloud Security", "IAM", "AI Security", "Security Automation", "Other"];
window.PROJECT_STATUSES = ["In Progress", "Completed", "Lab Simulation", "Research"];
window.ARTICLE_CATEGORIES = ["SOC Operations", "Threat Detection", "Incident Investigation", "Security Monitoring", "Cloud Security Fundamentals", "IAM Concepts", "Security Governance", "Cybersecurity & Business", "AI Security"];

window.PROJECTS = (window.SITE_DATA && window.SITE_DATA.projects) || [];
window.ARTICLES = (window.SITE_DATA && window.SITE_DATA.articles) || [];
window.LEARNING = (window.SITE_DATA && window.SITE_DATA.learning) || [];
window.EXPERIENCE = (window.SITE_DATA && window.SITE_DATA.experience) || [];
