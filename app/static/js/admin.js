/**
 * Admin — redirects to standalone admin panel.
 * Kept minimal; the real admin lives at /admin.
 */
const Admin = (() => {
    function showLogin() {
        window.open('/admin', '_blank');
    }

    function openPanel() {
        window.open('/admin', '_blank');
    }

    return { showLogin, openPanel };
})();
