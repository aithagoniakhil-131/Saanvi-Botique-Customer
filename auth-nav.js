/**
 * Shared Global Authentication and Navigation Handler for Saanvi Boutique.
 * Automatically synchronizes login/logout states, handles navigation link injection,
 * and implements client-side route protection.
 */
document.addEventListener("DOMContentLoaded", async () => {
  // 1. VERIFY SUPABASE CLIENT EXISTS
  if (!window.supabaseClient) {
    console.error("Supabase client is not initialized. Make sure to include supabase-config.js before auth-nav.js");
    return;
  }

  // 2. CHECK ACTIVE SESSION STATUS
  let session = null;
  try {
    const { data } = await window.supabaseClient.auth.getSession();
    session = data.session;
  } catch (err) {
    console.error("Error retrieving Supabase session:", err);
  }

  // 3. PAGE PROTECTION (ROUTE GUARD)
  const isWishlistPage = window.location.pathname.endsWith("wishlist.html");
  const isLoginPage = window.location.pathname.endsWith("login.html");
  
  if (isWishlistPage && !session) {
    // Redirect to login page if unauthorized
    window.location.href = "login.html";
    return;
  }

  if (isLoginPage && session) {
    const adminEmails = ["saanvi", "saanvibotique@gmail.com", "saanvobotique@gmail.com"];
    const isAdmin = sessionStorage.getItem("admin_session") === "authenticated" || 
                    (session.user && session.user.email && adminEmails.includes(session.user.email.toLowerCase()));
    if (isAdmin) {
      sessionStorage.setItem("admin_session", "authenticated");
      window.location.href = "admin-portal/dashboard.html";
    } else {
      window.location.href = "index.html";
    }
    return;
  }
 
  // 4. DYNAMIC NAVBAR UPDATE ROUTINES
  updateNavigationUI(session);
 
  // 5. LISTEN FOR REALTIME AUTH STATE CHANGES
  window.supabaseClient.auth.onAuthStateChange((event, newSession) => {
    // If transition happens (login/logout), update UI dynamically
    const sessionChanged = (session && !newSession) || (!session && newSession) || (session && newSession && session.user.id !== newSession.user.id);
    if (sessionChanged) {
      // If we are on a protected page and logged out, redirect
      if (isWishlistPage && !newSession) {
        window.location.href = "login.html";
      } else if (isLoginPage && newSession) {
        const adminEmails = ["saanvi", "saanvibotique@gmail.com", "saanvobotique@gmail.com"];
        const isAdmin = sessionStorage.getItem("admin_session") === "authenticated" || 
                        (newSession.user && newSession.user.email && adminEmails.includes(newSession.user.email.toLowerCase()));
        if (isAdmin) {
          sessionStorage.setItem("admin_session", "authenticated");
          window.location.href = "admin-portal/dashboard.html";
        } else {
          window.location.href = "index.html";
        }
      } else {
        window.location.reload();
      }
    }
  });
});

/**
 * Updates both Desktop and Mobile navigation elements to reflect current session.
 */
function updateNavigationUI(session) {
  // Select navigation container wrappers
  const desktopContainer = document.querySelector("header nav .hidden.lg\\:flex");
  const mobileMenu = document.getElementById("mobile-menu");

  const currentPath = window.location.pathname;
  const isWishlistActive = currentPath.endsWith("wishlist.html");

  // A. DESKTOP HEADER NAVIGATION UPDATE
  if (desktopContainer) {
    // 1. Inject Wishlist Tab if session exists and not already present
    const appointmentLink = desktopContainer.querySelector('a[href="appointment.html"]');
    const existingWishlist = desktopContainer.querySelector('a[href="wishlist.html"]');

    if (session) {
      if (!existingWishlist && appointmentLink) {
        const wishlistLink = document.createElement("a");
        wishlistLink.href = "wishlist.html";
        wishlistLink.className = isWishlistActive
          ? "nav-link active text-cream text-sm font-medium tracking-wide"
          : "nav-link text-cream/80 hover:text-cream text-sm font-medium tracking-wide transition";
        wishlistLink.textContent = "Wishlist";
        
        // Add CSS active underline indicator matching other items
        if (isWishlistActive) {
          wishlistLink.style.position = "relative";
          const style = document.createElement("style");
          style.innerHTML = `a[href="wishlist.html"].active::after { content: ""; position: absolute; bottom: -4px; left: 0; width: 100%; height: 2px; background: #e6e5b9; }`;
          document.head.appendChild(style);
        }

        desktopContainer.insertBefore(wishlistLink, appointmentLink);
      }
    } else {
      // Remove Wishlist tab if logged out
      if (existingWishlist) {
        existingWishlist.remove();
      }
    }

    // 2. Toggle Login/Logout Button
    const loginBtn = desktopContainer.querySelector('a[href="login.html"]');
    const existingLogoutBtn = document.getElementById("nav-logout-btn");

    if (session) {
      if (loginBtn) {
        // Replace static Login link with dynamic Logout button
        const logoutBtn = document.createElement("button");
        logoutBtn.id = "nav-logout-btn";
        logoutBtn.className = "ml-2 px-5 py-2.5 bg-cream text-burgundy text-sm font-semibold rounded-full hover:bg-white transition shadow-md cursor-pointer";
        logoutBtn.textContent = "Logout";
        logoutBtn.addEventListener("click", handleLogoutClick);
        loginBtn.parentNode.replaceChild(logoutBtn, loginBtn);
      }
    } else {
      if (existingLogoutBtn) {
        // Replace Logout button back with standard Login link
        const newLoginLink = document.createElement("a");
        newLoginLink.href = "login.html";
        newLoginLink.className = "ml-2 px-5 py-2.5 bg-cream text-burgundy text-sm font-semibold rounded-full hover:bg-white transition shadow-md";
        newLoginLink.textContent = "Login";
        existingLogoutBtn.parentNode.replaceChild(newLoginLink, existingLogoutBtn);
      }
    }
  }

  // B. MOBILE HEADER NAVIGATION UPDATE
  if (mobileMenu) {
    // 1. Inject Wishlist option if session exists
    const mobileAppointmentLink = mobileMenu.querySelector('a[href="appointment.html"]');
    const mobileExistingWishlist = mobileMenu.querySelector('a[href="wishlist.html"]');

    if (session) {
      if (!mobileExistingWishlist && mobileAppointmentLink) {
        const mobileWishlistLink = document.createElement("a");
        mobileWishlistLink.href = "wishlist.html";
        mobileWishlistLink.className = isWishlistActive
          ? "block text-cream py-2 font-semibold"
          : "block text-cream/80 py-2";
        mobileWishlistLink.textContent = "Wishlist";
        mobileMenu.insertBefore(mobileWishlistLink, mobileAppointmentLink);
      }
    } else {
      if (mobileExistingWishlist) {
        mobileExistingWishlist.remove();
      }
    }

    // 2. Toggle Mobile Login/Logout Button
    // We search for elements pointing to login.html or carrying login text in the mobile drawer
    const mobileLoginBtn = Array.from(mobileMenu.querySelectorAll("a, button")).find(
      el => (el.getAttribute("href") && el.getAttribute("href").includes("login.html")) || el.textContent.trim() === "Login"
    );
    const mobileExistingLogout = document.getElementById("mobile-nav-logout-btn");

    if (session) {
      if (mobileLoginBtn) {
        const mobileLogoutBtn = document.createElement("button");
        mobileLogoutBtn.id = "mobile-nav-logout-btn";
        mobileLogoutBtn.className = "block text-left w-full text-cream/80 py-2 font-medium cursor-pointer";
        mobileLogoutBtn.textContent = "Logout";
        mobileLogoutBtn.addEventListener("click", handleLogoutClick);
        mobileLoginBtn.parentNode.replaceChild(mobileLogoutBtn, mobileLoginBtn);
      }
    } else {
      if (mobileExistingLogout) {
        const newMobileLogin = document.createElement("a");
        newMobileLogin.href = "login.html";
        newMobileLogin.className = "block text-cream/80 py-2";
        newMobileLogin.textContent = "Login";
        mobileExistingLogout.parentNode.replaceChild(newMobileLogin, mobileExistingLogout);
      }
    }
  }
}

/**
 * Handle logout button clicks.
 */
async function handleLogoutClick(e) {
  e.preventDefault();
  if (window.supabaseClient) {
    try {
      const { error } = await window.supabaseClient.auth.signOut();
      if (error) throw error;
      
      // Clear local session storage flags
      sessionStorage.removeItem("admin_session");
      
      // Redirect to homepage
      window.location.href = "index.html";
    } catch (err) {
      console.error("Signout error:", err);
      // Fallback redirect
      window.location.href = "index.html";
    }
  }
}

// 6. GLOBAL CAPACITOR HARDWARE BACK BUTTON NAVIGATION FOR MOBILE
if (window.Capacitor && window.Capacitor.Plugins) {
  const { App } = window.Capacitor.Plugins;
  if (App) {
    App.addListener('backButton', (data) => {
      if (data.canGoBack) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });
  }
}

