const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Environment-specific configuration
const isProduction = import.meta.env.PROD;
const isRailway = import.meta.env.VITE_IS_RAILWAY;
const apiUrl =
  isProduction && isRailway
    ? import.meta.env.VITE_RAILWAY_API_URL
    : import.meta.env.VITE_API_URL;

class ApiService {
  constructor() {
    this.token = localStorage.getItem("token");
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }

  getHeaders() {
    const headers = {
      "Content-Type": "application/json",
    };
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${apiUrl || API_BASE_URL}${endpoint}`;

    // If body is FormData, don't set Content-Type (browser will set it with boundary)
    const isFormData = options.body instanceof FormData;
    const headers = isFormData ? {} : this.getHeaders();

    const config = {
      headers,
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  // Auth
  async login(email, password) {
    const data = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async register(email, password, role = "viewer") {
    const data = await this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, role }),
    });
    this.setToken(data.token);
    return data;
  }

  async getCurrentUser() {
    return this.request("/auth/me");
  }

  logout() {
    this.setToken(null);
  }

  // Teams (public - no auth required for read)
  async getTeams() {
    return this.request("/teams");
  }

  async getTeam(id) {
    return this.request(`/teams/${id}`);
  }

  async createTeam(data, logoFile = null) {
    if (logoFile) {
      // Use FormData for file upload
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("logo", logoFile);

      return this.request("/teams/with-logo", {
        method: "POST",
        body: formData,
      });
    }

    return this.request("/teams", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateTeam(id, data) {
    return this.request(`/teams/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteTeam(id) {
    return this.request(`/teams/${id}`, {
      method: "DELETE",
    });
  }

  // Players (public - no auth required for read)
  async getPlayers(teamId = null) {
    const query = teamId ? `?teamId=${teamId}` : "";
    return this.request(`/players${query}`);
  }

  async createPlayer(data) {
    return this.request("/players", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updatePlayer(id, data) {
    return this.request(`/players/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deletePlayer(id) {
    return this.request(`/players/${id}`, {
      method: "DELETE",
    });
  }

  // Matches (public - no auth required for read)
  async getMatches(status = null, round = null) {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (round) params.append("round", round);
    const query = params.toString() ? `?${params.toString()}` : "";
    return this.request(`/matches${query}`);
  }

  async getMatch(id) {
    return this.request(`/matches/${id}`);
  }

  async generateFixtures(data) {
    return this.request("/matches/generate-fixtures", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateMatchResult(id, data) {
    return this.request(`/matches/${id}/result`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async updateMatch(id, data) {
    return this.request(`/matches/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Points Table (public - no auth required)
  async getPointsTable() {
    return this.request("/points");
  }

  async getTeamStats(teamId) {
    return this.request(`/points/team/${teamId}`);
  }

  // Playoffs (public - no auth required for read)
  async getPlayoffs() {
    return this.request("/playoffs");
  }

  async generatePlayoffs() {
    return this.request("/playoffs/generate", {
      method: "POST",
    });
  }

  async updatePlayoffResult(id, data) {
    return this.request(`/playoffs/${id}/result`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async updatePlayoff(id, data) {
    return this.request(`/playoffs/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }
}

export default new ApiService();
