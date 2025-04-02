document.addEventListener("DOMContentLoaded", () => {
  // 상태 관리
  const state = {
    currentSection: "home",
    isLoggedIn: false,
    token: localStorage.getItem("token"),
    user: JSON.parse(localStorage.getItem("user") || "null"),
    theme: localStorage.getItem("theme") || "dark",
    usersData: {
      users: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      },
    },
  };

  // UI 요소
  const ui = {
    sections: {
      home: document.getElementById("home-section"),
      register: document.getElementById("register-section"),
      login: document.getElementById("login-section"),
      profile: document.getElementById("profile-section"),
      editProfile: document.getElementById("edit-profile-section"),
      password: document.getElementById("change-password-section"),
      users: document.getElementById("users-section"),
    },
    nav: {
      home: document.getElementById("nav-home"),
      register: document.getElementById("nav-register"),
      login: document.getElementById("nav-login"),
      profile: document.getElementById("nav-profile"),
      logout: document.getElementById("nav-logout"),
      users: document.getElementById("nav-users"),
    },
    forms: {
      register: document.getElementById("register-form"),
      login: document.getElementById("login-form"),
      editProfile: document.getElementById("edit-profile-form"),
      changePassword: document.getElementById("change-password-form"),
      avatar: document.getElementById("avatar-form"),
    },
    themeToggle: document.getElementById("theme-toggle"),
    passwordStrength: document.getElementById("password-strength"),
    usersList: document.getElementById("users-list"),
    userSearch: document.getElementById("user-search"),
    pagination: {
      prevButton: document.getElementById("prev-page"),
      nextButton: document.getElementById("next-page"),
      pageInfo: document.getElementById("page-info"),
    },
    messageContainer: document.getElementById("message-container"),
    avatarPreview: document.getElementById("avatar-preview"),
  };

  // 테마 초기화
  function initTheme() {
    document.documentElement.setAttribute("data-theme", state.theme);
    if (ui.themeToggle) {
      ui.themeToggle.textContent = state.theme === "dark" ? "☀️" : "🌙";
    }
  }

  // 테마 토글
  function toggleTheme() {
    state.theme = state.theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", state.theme);
    initTheme();
  }

  // UI 헬퍼 함수들
  function hideElement(element) {
    if (element) element.classList.add("hidden");
  }

  function showElement(element) {
    if (element) element.classList.remove("hidden");
  }

  function setActiveLink(element) {
    if (element) element.classList.add("active");
  }

  function removeActiveLink(element) {
    if (element) element.classList.remove("active");
  }

  // 디버깅 로거
  function log(message, type = "info") {
    const logPrefix = "📝 [UserApp]";

    switch (type) {
      case "error":
        console.error(`${logPrefix} 🚨 ${message}`);
        break;
      case "warn":
        console.warn(`${logPrefix} ⚠️ ${message}`);
        break;
      case "debug":
        console.log(`${logPrefix} 🐛 ${message}`);
        break;
      default:
        console.log(`${logPrefix} ℹ️ ${message}`);
    }
  }

  // 섹션 표시 함수
  function showSection(sectionId) {
    log(`섹션 표시: ${sectionId}`);

    // 모든 섹션 숨기기
    Object.values(ui.sections).forEach(hideElement);

    // 선택한 섹션 표시
    if (ui.sections[sectionId]) {
      showElement(ui.sections[sectionId]);
      state.currentSection = sectionId;
    } else {
      log(`섹션을 찾을 수 없음: ${sectionId}`, "error");
      return;
    }

    // 현재 섹션에 따라 추가 작업
    if (sectionId === "profile" && state.user) {
      fillProfileForm();
    } else if (sectionId === "users") {
      loadUsers();
    }

    // 활성 네비게이션 표시 업데이트
    updateActiveNavigation();
    log(`현재 활성 섹션: ${state.currentSection}`);
  }

  // 활성 네비게이션 링크 업데이트
  function updateActiveNavigation() {
    // 모든 네비게이션 링크에서 active 클래스 제거
    const navLinks = document.querySelectorAll("#main-nav a");
    navLinks.forEach(removeActiveLink);

    // 현재 섹션에 따라 active 클래스 추가
    switch (state.currentSection) {
      case "home":
        setActiveLink(ui.nav.home);
        break;
      case "register":
        setActiveLink(ui.nav.register);
        break;
      case "login":
        setActiveLink(ui.nav.login);
        break;
      case "profile":
      case "editProfile":
        setActiveLink(ui.nav.profile);
        break;
      case "users":
        setActiveLink(ui.nav.users);
        break;
    }
  }

  // 네비게이션 상태 업데이트
  function updateNavigation() {
    // 로그인 상태에 따라 메뉴 표시/숨김
    if (state.isLoggedIn) {
      hideElement(ui.nav.register);
      hideElement(ui.nav.login);
      showElement(ui.nav.profile);
      showElement(ui.nav.logout);
      showElement(ui.nav.users);
    } else {
      showElement(ui.nav.register);
      showElement(ui.nav.login);
      hideElement(ui.nav.profile);
      hideElement(ui.nav.logout);
      hideElement(ui.nav.users);

      // 로그인 되지 않은 상태에서 로그인이 필요한 섹션이면 홈으로 리다이렉트
      if (
        state.currentSection === "profile" ||
        state.currentSection === "editProfile" ||
        state.currentSection === "password" ||
        state.currentSection === "users"
      ) {
        showSection("home");
      }
    }

    // 활성 네비게이션 링크 업데이트
    updateActiveNavigation();
  }

  // 메시지 표시 함수 (추가된 타입별 스타일)
  function showMessage(message, type = "info") {
    const messageContainer = document.getElementById("message-container");
    const messageContent = document.getElementById("message-content");

    if (!messageContainer || !messageContent) return;

    messageContent.textContent = message;
    messageContainer.className = "message-container";
    messageContainer.classList.add(`message-${type}`);
    messageContainer.classList.remove("hidden");

    // 5초 후 메시지 자동 제거
    setTimeout(() => {
      messageContainer.classList.add("hidden");
    }, 5000);
  }

  // 로그인 상태 확인
  function checkLoginStatus() {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (token && user) {
      state.isLoggedIn = true;
      state.token = token;
      state.user = user;
    } else {
      state.isLoggedIn = false;
      state.token = null;
      state.user = null;
    }

    updateNavigation();
  }

  // 프로필 양식 채우기
  function fillProfileForm() {
    if (!state.user) return;

    // 프로필 섹션 데이터
    const profileUsername = document.getElementById("profile-username");
    const profileEmail = document.getElementById("profile-email");
    const profileFullname = document.getElementById("profile-fullname");
    const profileCreated = document.getElementById("profile-created");
    const profileAvatar = document.getElementById("profile-avatar");

    if (profileUsername)
      profileUsername.textContent = state.user.username || "";
    if (profileEmail) profileEmail.textContent = state.user.email || "";
    if (profileFullname)
      profileFullname.textContent = state.user.full_name || "";
    if (profileCreated && state.user.created_at) {
      const createdDate = new Date(state.user.created_at);
      profileCreated.textContent = createdDate.toLocaleDateString();
    }

    // 프로필 편집 폼 데이터
    const editEmail = document.getElementById("edit-email");
    const editFullname = document.getElementById("edit-fullname");

    if (editEmail) editEmail.value = state.user.email || "";
    if (editFullname) editFullname.value = state.user.full_name || "";

    // 아바타 설정
    if (profileAvatar) {
      if (state.user.avatar_url) {
        profileAvatar.innerHTML = `<img src="${state.user.avatar_url}" alt="${state.user.username}" />`;
      } else {
        profileAvatar.innerHTML = `<i class="fas fa-user"></i>`;
      }
    }
  }

  // 비밀번호 강도 측정
  function updatePasswordStrength(password) {
    if (!ui.passwordStrength) return;

    let strength = 0;
    let feedback = "";

    // 길이 검사
    if (password.length >= 8) {
      strength += 1;
    }

    // 대문자 검사
    if (/[A-Z]/.test(password)) {
      strength += 1;
    }

    // 특수문자 검사
    if (/[!@#$%^&*]/.test(password)) {
      strength += 1;
    }

    // 숫자 검사
    if (/[0-9]/.test(password)) {
      strength += 1;
    }

    // 강도에 따른 피드백
    if (password.length === 0) {
      ui.passwordStrength.className = "password-strength";
      ui.passwordStrength.textContent = "";
    } else if (strength === 0 || strength === 1) {
      ui.passwordStrength.className = "password-strength weak";
      ui.passwordStrength.textContent = "Weak";
    } else if (strength === 2) {
      ui.passwordStrength.className = "password-strength medium";
      ui.passwordStrength.textContent = "Medium";
    } else if (strength === 3) {
      ui.passwordStrength.className = "password-strength strong";
      ui.passwordStrength.textContent = "Strong";
    } else {
      ui.passwordStrength.className = "password-strength very-strong";
      ui.passwordStrength.textContent = "Very Strong";
    }
  }

  // API 호출 함수
  async function api(
    endpoint,
    method = "GET",
    data = null,
    isFormData = false
  ) {
    // URL이 이미 /api/로 시작하는지 확인
    const url = endpoint.startsWith("/api/") ? endpoint : `/api/${endpoint}`;

    const headers = {};

    if (state.token) {
      headers["Authorization"] = `Bearer ${state.token}`;
    }

    if (!isFormData && method !== "GET" && data) {
      headers["Content-Type"] = "application/json";
    }

    const options = {
      method,
      headers,
    };

    if (data) {
      if (method !== "GET") {
        options.body = isFormData ? data : JSON.stringify(data);
      }
    }

    try {
      console.log(`API Request: ${method} ${url}`);
      const response = await fetch(url, options);

      let result;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        result = await response.json();
      } else {
        const text = await response.text();
        result = { message: text };
      }

      if (!response.ok) {
        console.error(
          `API Error (${endpoint}):`,
          result.error || result.message || "Unknown error"
        );
        throw new Error(
          result.error || result.message || "Something went wrong"
        );
      }

      return { success: true, data: result };
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error.message);
      return { success: false, error: error.message };
    }
  }

  // 사용자 등록
  async function registerUser(userData) {
    const result = await api("users/register", "POST", userData);

    if (result.success) {
      showMessage("Registered successfully. You can now login.", "success");
      ui.forms.register.reset();
      showSection("login");
    } else {
      showMessage(result.error, "error");
    }
  }

  // 로그인
  async function loginUser(credentials) {
    const result = await api("users/login", "POST", credentials);

    if (result.success) {
      state.isLoggedIn = true;
      state.token = result.data.token;
      state.user = result.data.user;

      localStorage.setItem("token", result.data.token);
      localStorage.setItem("user", JSON.stringify(result.data.user));

      updateNavigation();
      showMessage("Logged in successfully.", "success");
      showSection("profile");
    } else {
      showMessage(result.error, "error");
    }
  }

  // 로그아웃
  function logoutUser() {
    state.isLoggedIn = false;
    state.token = null;
    state.user = null;

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    updateNavigation();
    showMessage("Logged out successfully.", "info");
    showSection("home");
  }

  // 프로필 업데이트
  async function updateProfile(profileData) {
    const result = await api("users/profile", "PUT", profileData);

    if (result.success) {
      state.user = result.data.user;
      localStorage.setItem("user", JSON.stringify(result.data.user));

      showMessage("Profile updated successfully.", "success");
      fillProfileForm();
    } else {
      showMessage(result.error, "error");
    }
  }

  // 비밀번호 변경
  async function changePassword(passwordData) {
    const result = await api("users/password", "PUT", passwordData);

    if (result.success) {
      showMessage("Password changed successfully.", "success");
      ui.forms.changePassword.reset();
    } else {
      showMessage(result.error, "error");
    }
  }

  // 아바타 업로드
  async function uploadAvatar(formData) {
    const result = await api("users/avatar", "POST", formData, true);

    if (result.success) {
      state.user = result.data.user;
      localStorage.setItem("user", JSON.stringify(result.data.user));

      showMessage("Avatar uploaded successfully.", "success");
      fillProfileForm();
    } else {
      showMessage(result.error, "error");
    }
  }

  // 사용자 목록 로드
  async function loadUsers(page = 1, search = "") {
    if (!state.isLoggedIn) return;

    try {
      let endpoint = `users?page=${page}&limit=10`;

      // 검색어가 있는 경우 URL 인코딩하여 추가
      if (search && search.trim() !== "") {
        endpoint += `&search=${encodeURIComponent(search.trim())}`;
      }

      const result = await api(endpoint);

      if (result.success) {
        state.usersData = result.data;
        renderUsers();
      } else {
        showMessage(result.error || "Failed to load users", "error");
      }
    } catch (error) {
      console.error("Load users error:", error);
      showMessage("An error occurred while fetching users.", "error");
    }
  }

  // 사용자 목록 렌더링
  function renderUsers() {
    if (!ui.usersList) return;

    // 목록 초기화
    ui.usersList.innerHTML = "";

    if (!state.usersData.users || state.usersData.users.length === 0) {
      ui.usersList.innerHTML = '<div class="empty-state">No users found</div>';
      return;
    }

    // 사용자 카드 생성
    state.usersData.users.forEach((user) => {
      const userCard = document.createElement("div");
      userCard.className = "user-card";

      const avatar =
        user.avatar_url ||
        "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";

      userCard.innerHTML = `
        <div class="user-avatar">
          <img src="${avatar}" alt="${user.username}">
        </div>
        <div class="user-info">
          <h3>${user.username}</h3>
          <p>${user.full_name || ""}</p>
          <p>${user.email}</p>
          <p class="user-joined">Joined: ${
            user.created_at
              ? new Date(user.created_at).toLocaleDateString()
              : "Unknown"
          }</p>
        </div>
      `;

      ui.usersList.appendChild(userCard);
    });

    // 페이지네이션 업데이트
    renderPagination();
  }

  // 페이지네이션
  function renderPagination() {
    const { prevButton, nextButton, pageInfo } = ui.pagination;
    if (!prevButton || !nextButton || !pageInfo) return;

    // 기본 페이지네이션 정보가 없는 경우 기본값 사용
    const pagination = state.usersData.pagination || {
      page: 1,
      totalPages: 1,
    };

    const page = pagination.page || 1;
    const totalPages = pagination.totalPages || 1;

    // 이전 버튼 상태 업데이트
    prevButton.disabled = page <= 1;
    prevButton.onclick = () => {
      if (page > 1) {
        const searchQuery = ui.userSearch ? ui.userSearch.value : "";
        loadUsers(page - 1, searchQuery);
      }
    };

    // 다음 버튼 상태 업데이트
    nextButton.disabled = page >= totalPages;
    nextButton.onclick = () => {
      if (page < totalPages) {
        const searchQuery = ui.userSearch ? ui.userSearch.value : "";
        loadUsers(page + 1, searchQuery);
      }
    };

    // 페이지 정보 업데이트
    pageInfo.textContent = `Page ${page} of ${totalPages}`;
  }

  // 이벤트 리스너 설정
  function setupEventListeners() {
    // 테마 토글 버튼
    if (ui.themeToggle) {
      ui.themeToggle.addEventListener("click", toggleTheme);
    }

    // 메인 페이지 버튼
    const homeRegisterBtn = document.getElementById("home-register-btn");
    const homeLoginBtn = document.getElementById("home-login-btn");

    if (homeRegisterBtn) {
      homeRegisterBtn.addEventListener("click", (e) => {
        e.preventDefault();
        showSection("register");
      });
    }

    if (homeLoginBtn) {
      homeLoginBtn.addEventListener("click", (e) => {
        e.preventDefault();
        showSection("login");
      });
    }

    // 폼 간 네비게이션
    const registerToLogin = document.getElementById("register-to-login");
    const loginToRegister = document.getElementById("login-to-register");

    if (registerToLogin) {
      registerToLogin.addEventListener("click", (e) => {
        e.preventDefault();
        showSection("login");
      });
    }

    if (loginToRegister) {
      loginToRegister.addEventListener("click", (e) => {
        e.preventDefault();
        showSection("register");
      });
    }

    // 네비게이션 리스너
    if (ui.nav.home) {
      ui.nav.home.addEventListener("click", (e) => {
        e.preventDefault();
        showSection("home");
      });
    }

    if (ui.nav.register) {
      ui.nav.register.addEventListener("click", (e) => {
        e.preventDefault();
        showSection("register");
      });
    }

    if (ui.nav.login) {
      ui.nav.login.addEventListener("click", (e) => {
        e.preventDefault();
        showSection("login");
      });
    }

    if (ui.nav.profile) {
      ui.nav.profile.addEventListener("click", (e) => {
        e.preventDefault();
        showSection("profile");
      });
    }

    if (ui.nav.logout) {
      ui.nav.logout.addEventListener("click", (e) => {
        e.preventDefault();
        logoutUser();
      });
    }

    if (ui.nav.users) {
      ui.nav.users.addEventListener("click", (e) => {
        e.preventDefault();
        showSection("users");
      });
    }

    // 등록 폼 제출
    if (ui.forms.register) {
      ui.forms.register.addEventListener("submit", (e) => {
        e.preventDefault();

        const username = document.getElementById("register-username").value;
        const email = document.getElementById("register-email").value;
        const password = document.getElementById("register-password").value;
        const fullName = document.getElementById("register-fullname").value;

        registerUser({ username, email, password, full_name: fullName });
      });

      // 비밀번호 강도 체크
      const passwordInput = document.getElementById("register-password");
      if (passwordInput) {
        passwordInput.addEventListener("input", (e) => {
          updatePasswordStrength(e.target.value);
        });
      }
    }

    // 로그인 폼 제출
    if (ui.forms.login) {
      ui.forms.login.addEventListener("submit", (e) => {
        e.preventDefault();

        const username = document.getElementById("login-username").value;
        const password = document.getElementById("login-password").value;
        const rememberMe = document.getElementById("remember-me").checked;

        loginUser({ username, password, remember_me: rememberMe });
      });
    }

    // 프로필 폼 제출
    if (ui.forms.editProfile) {
      ui.forms.editProfile.addEventListener("submit", (e) => {
        e.preventDefault();

        const email = document.getElementById("edit-email").value;
        const fullName = document.getElementById("edit-fullname").value;

        updateProfile({ email, full_name: fullName });
      });
    }

    // 비밀번호 변경 폼 제출
    if (ui.forms.changePassword) {
      ui.forms.changePassword.addEventListener("submit", (e) => {
        e.preventDefault();

        const currentPassword =
          document.getElementById("current-password").value;
        const newPassword = document.getElementById("new-password").value;
        const confirmPassword =
          document.getElementById("confirm-password").value;

        if (newPassword !== confirmPassword) {
          showMessage("New passwords do not match", "error");
          return;
        }

        changePassword({
          current_password: currentPassword,
          new_password: newPassword,
        });
      });

      // 비밀번호 강도 체크
      const newPasswordInput = document.getElementById("new-password");
      if (newPasswordInput) {
        newPasswordInput.addEventListener("input", (e) => {
          updatePasswordStrength(e.target.value);
        });
      }
    }

    // 아바타 폼 제출
    if (ui.forms.avatar) {
      ui.forms.avatar.addEventListener("submit", (e) => {
        e.preventDefault();

        const avatarInput = document.getElementById("avatar-file");
        if (!avatarInput.files || avatarInput.files.length === 0) {
          showMessage("Please select an image file", "error");
          return;
        }

        const formData = new FormData();
        formData.append("avatar", avatarInput.files[0]);

        uploadAvatar(formData);
      });

      // 아바타 미리보기
      const avatarInput = document.getElementById("avatar-file");
      if (avatarInput) {
        avatarInput.addEventListener("change", (e) => {
          if (e.target.files && e.target.files[0] && ui.avatarPreview) {
            const reader = new FileReader();
            reader.onload = function (event) {
              ui.avatarPreview.src = event.target.result;
            };
            reader.readAsDataURL(e.target.files[0]);
          }
        });
      }
    }

    // 사용자 검색
    if (ui.userSearch) {
      // 디바운스 적용을 위한 타이머
      let searchTimer;

      ui.userSearch.addEventListener("input", (e) => {
        clearTimeout(searchTimer);

        // 검색창이 비어있는 경우 즉시 기본 목록 로드
        if (!e.target.value.trim()) {
          loadUsers(1, "");
          return;
        }

        // 타이핑 후 500ms 후에 검색 실행
        searchTimer = setTimeout(() => {
          loadUsers(1, e.target.value);
        }, 500);
      });

      // 엔터 키 이벤트 추가
      ui.userSearch.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          clearTimeout(searchTimer);
          loadUsers(1, e.target.value);
        }
      });

      // 검색 버튼 이벤트 추가
      const searchBtn = document.getElementById("search-btn");
      if (searchBtn) {
        searchBtn.addEventListener("click", () => {
          clearTimeout(searchTimer);
          loadUsers(1, ui.userSearch.value);
        });
      }
    }

    // 프로필 관련 버튼
    const editProfileBtn = document.getElementById("edit-profile-btn");
    const changePasswordBtn = document.getElementById("change-password-btn");
    const cancelEditBtn = document.getElementById("cancel-edit-btn");
    const cancelPasswordBtn = document.getElementById("cancel-password-btn");

    if (editProfileBtn) {
      editProfileBtn.addEventListener("click", (e) => {
        e.preventDefault();
        showSection("editProfile");
      });
    }

    if (changePasswordBtn) {
      changePasswordBtn.addEventListener("click", (e) => {
        e.preventDefault();
        showSection("password");
      });
    }

    if (cancelEditBtn) {
      cancelEditBtn.addEventListener("click", (e) => {
        e.preventDefault();
        showSection("profile");
      });
    }

    if (cancelPasswordBtn) {
      cancelPasswordBtn.addEventListener("click", (e) => {
        e.preventDefault();
        showSection("profile");
      });
    }

    // 비밀번호 표시 토글 버튼
    const togglePasswordButtons = document.querySelectorAll(".toggle-password");

    togglePasswordButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const passwordInput = this.previousElementSibling;
        const icon = this.querySelector("i");

        if (passwordInput.type === "password") {
          passwordInput.type = "text";
          icon.className = "fas fa-eye-slash";
        } else {
          passwordInput.type = "password";
          icon.className = "fas fa-eye";
        }
      });
    });
  }

  // 앱 초기화
  function init() {
    log("앱 초기화 시작");
    initTheme();
    checkLoginStatus();

    // 기본 상태 설정
    state.usersData = {
      users: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      },
    };

    // 이벤트 리스너 설정
    setupEventListeners();

    // 초기 섹션 표시
    showSection("home");
    log("앱 초기화 완료");
  }

  // 앱 시작
  init();

  // 오류 처리를 위한 전역 이벤트 리스너
  window.addEventListener("error", function (event) {
    log(
      `오류 발생: ${event.message} (${event.filename}:${event.lineno})`,
      "error"
    );
  });
});
