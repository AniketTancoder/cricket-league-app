import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function Admin() {
  const [activeTab, setActiveTab] = useState("add-team");
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user, isAdmin } = useAuth();

  // Form states
  const [teamName, setTeamName] = useState("");
  const [teamLogo, setTeamLogo] = useState(null);
  const [teamPlayers, setTeamPlayers] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [matchForm, setMatchForm] = useState({});
  const [fixtureSettings, setFixtureSettings] = useState({
    matchesPerTeam: 2,
    startDate: new Date().toISOString().split("T")[0],
    venue: "Stadium",
  });

  useEffect(() => {
    if (!isAdmin) return;
    loadData();
  }, [isAdmin, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [teamsData, matchesData] = await Promise.all([
        api.getTeams(),
        api.getMatches(),
      ]);
      setTeams(teamsData);
      setMatches(matchesData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Team handlers
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const validPlayers = teamPlayers.filter((p) => p.trim() !== "");
      const team = await api.createTeam({ name: teamName }, teamLogo);

      for (const playerName of validPlayers) {
        await api.createPlayer({ name: playerName, teamId: team.id });
      }

      setTeamName("");
      setTeamLogo(null);
      setTeamPlayers(["", "", "", "", "", "", "", ""]);
      loadData();
      alert("Team created with players successfully");
    } catch (error) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (
      !confirm("Are you sure you want to delete this team and all its players?")
    )
      return;
    try {
      await api.deleteTeam(teamId);
      loadData();
      alert("Team deleted successfully");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeletePlayer = async (playerId) => {
    if (!confirm("Delete this player?")) return;
    try {
      await api.deletePlayer(playerId);
      loadData();
    } catch (error) {
      alert(error.message);
    }
  };

  // Match handlers
  const handleGenerateFixtures = async () => {
    if (
      !confirm(
        `Generate fixtures with ${fixtureSettings.matchesPerTeam} match(es) per team? This will clear existing ones.`,
      )
    )
      return;
    setSaving(true);
    try {
      await api.generateFixtures(fixtureSettings);
      loadData();
      alert("Fixtures generated successfully");
    } catch (error) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateMatchResult = async (matchId) => {
    const form = matchForm[matchId] || {};

    // Validation
    if (!form.battingFirst) {
      alert("Please select which team won the toss and is batting first");
      return;
    }
    if (!form.team1Score || !form.team2Score) {
      alert("Please enter scores for both teams");
      return;
    }
    setSaving(true);
    try {
      await api.updateMatchResult(matchId, {
        team1Score: parseInt(form.team1Score),
        team1Overs: parseFloat(form.team1Overs) || 0,
        team2Score: parseInt(form.team2Score),
        team2Overs: parseFloat(form.team2Overs) || 0,
        totalOvers: parseInt(form.totalOvers) || 20,
        battingFirst: form.battingFirst,
      });
      setMatchForm({ ...matchForm, [matchId]: {} });
      loadData();
      alert("Result saved successfully");
    } catch (error) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const getMatchForm = (matchId) => matchForm[matchId] || {};

  const updateMatchForm = (matchId, field, value) => {
    setMatchForm({
      ...matchForm,
      [matchId]: { ...getMatchForm(matchId), [field]: value },
    });
  };

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-5xl">🔐</span>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">
            Admin Access Required
          </h2>
          <p className="mt-2 text-gray-500">
            Please login as admin to access this page.
          </p>
          <a href="/login" className="mt-4 inline-block btn btn-primary">
            Login as Admin
          </a>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "add-team", label: "➕ Add Team" },
    { id: "teams", label: "📋 Manage Teams" },
    { id: "fixtures", label: "📅 Fixtures & Results" },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "scheduled":
        return "bg-gray-100 text-gray-700";
      case "tie":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">⚙️ Admin Panel</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Add Team Tab */}
          {activeTab === "add-team" && (
            <div className="card p-6 max-w-2xl">
              <h2 className="text-xl font-semibold mb-4 text-blue-600">
                ➕ Add New Team with 8 Players
              </h2>
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div className="flex items-start gap-6">
                  {/* Logo Upload */}
                  <div className="flex-shrink-0">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Team Logo (Optional)
                    </label>
                    <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                      {teamLogo ? (
                        <img
                          src={URL.createObjectURL(teamLogo)}
                          alt="Team Logo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-400 text-xs text-center p-2">
                          Upload Logo
                        </span>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setTeamLogo(e.target.files[0] || null)}
                      className="mt-2 text-sm text-gray-500"
                    />
                  </div>

                  {/* Team Name */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Team Name *
                    </label>
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="input"
                      placeholder="Enter team name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Players (enter at least 1)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {teamPlayers.map((player, idx) => (
                      <input
                        key={idx}
                        type="text"
                        value={player}
                        onChange={(e) => {
                          const newPlayers = [...teamPlayers];
                          newPlayers[idx] = e.target.value;
                          setTeamPlayers(newPlayers);
                        }}
                        className="input text-sm"
                        placeholder={`Player ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving || !teamName.trim()}
                  className="btn btn-primary w-full py-3 text-lg"
                >
                  {saving ? "Creating..." : "➕ Create Team with Players"}
                </button>
              </form>
            </div>
          )}

          {/* Manage Teams Tab */}
          {activeTab === "teams" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">📋 All Teams & Players</h2>
              {teams.length === 0 ? (
                <p className="text-gray-500">
                  No teams yet. Go to "Add Team" to create one.
                </p>
              ) : (
                teams.map((team) => (
                  <div key={team.id} className="card p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">
                          {team.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {team.players?.length || 0} players
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteTeam(team.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200"
                      >
                        🗑️ Delete
                      </button>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex flex-wrap gap-2">
                        {team.players?.map((player) => (
                          <div
                            key={player.id}
                            className="flex items-center bg-blue-50 border border-blue-200 rounded-full px-3 py-1"
                          >
                            <span className="text-sm font-medium text-blue-800">
                              {player.name}
                            </span>
                            <button
                              onClick={() => handleDeletePlayer(player.id)}
                              className="ml-2 text-red-500 hover:text-red-700 font-bold"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        {(!team.players || team.players.length === 0) && (
                          <span className="text-gray-400 text-sm">
                            No players
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Fixtures Tab */}
          {activeTab === "fixtures" && (
            <div className="space-y-6">
              {/* Generate Fixtures */}
              <div className="card p-6">
                <h2 className="text-xl font-semibold mb-4">
                  📅 Generate Fixtures
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Matches per Team
                    </label>
                    <select
                      value={fixtureSettings.matchesPerTeam}
                      onChange={(e) =>
                        setFixtureSettings({
                          ...fixtureSettings,
                          matchesPerTeam: parseInt(e.target.value),
                        })
                      }
                      className="input"
                    >
                      <option value={1}>1 match (5 total)</option>
                      <option value={2}>2 matches (10 total)</option>
                      <option value={3}>3 matches (15 total)</option>
                      <option value={4}>4 matches (20 total)</option>
                      <option value={5}>5 matches (25 total)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={fixtureSettings.startDate}
                      onChange={(e) =>
                        setFixtureSettings({
                          ...fixtureSettings,
                          startDate: e.target.value,
                        })
                      }
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Venue
                    </label>
                    <input
                      type="text"
                      value={fixtureSettings.venue}
                      onChange={(e) =>
                        setFixtureSettings({
                          ...fixtureSettings,
                          venue: e.target.value,
                        })
                      }
                      className="input"
                      placeholder="Stadium name"
                    />
                  </div>
                </div>
                <button
                  onClick={handleGenerateFixtures}
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving ? "Generating..." : "🔄 Generate Fixtures"}
                </button>
              </div>

              {/* Match Results */}
              <div className="card p-6">
                <h2 className="text-xl font-semibold mb-4">
                  ⚽ Enter Match Results (with NRR)
                </h2>
                <div className="space-y-4">
                  {matches.filter((m) => m.status === "scheduled").length ===
                  0 ? (
                    <p className="text-gray-500">
                      No scheduled matches. Generate fixtures first.
                    </p>
                  ) : (
                    matches
                      .filter((m) => m.status === "scheduled")
                      .map((match) => (
                        <div
                          key={match.id}
                          className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                        >
                          <div className="flex justify-between items-center mb-3">
                            <div className="font-bold">
                              {match.team1?.name} vs {match.team2?.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {match.matchDate
                                ? new Date(match.matchDate).toLocaleDateString()
                                : "TBD"}{" "}
                              | {match.venue}
                            </div>
                          </div>

                          {/* Total Overs Input for each match */}
                          <div className="mb-3">
                            <label className="block text-xs text-gray-600 mb-1 font-medium">
                              Total Overs for this Match *
                            </label>
                            <input
                              type="number"
                              placeholder="Enter total overs (e.g. 20)"
                              className="input"
                              value={getMatchForm(match.id).totalOvers || ""}
                              onChange={(e) =>
                                updateMatchForm(
                                  match.id,
                                  "totalOvers",
                                  e.target.value,
                                )
                              }
                            />
                          </div>

                          {/* Toss Winner - Who bats first */}
                          <div className="mb-3">
                            <label className="block text-xs text-gray-600 mb-1 font-medium">
                              🏏 Toss Winner - Batting First
                            </label>
                            <select
                              className="input"
                              value={getMatchForm(match.id).battingFirst || ""}
                              onChange={(e) =>
                                updateMatchForm(
                                  match.id,
                                  "battingFirst",
                                  parseInt(e.target.value),
                                )
                              }
                            >
                              <option value="">
                                Select team that wins toss & bats first
                              </option>
                              <option value={match.team1Id}>
                                {match.team1?.name} (Bat First)
                              </option>
                              <option value={match.team2Id}>
                                {match.team2?.name} (Bat First)
                              </option>
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1 font-medium">
                                {getMatchForm(match.id).battingFirst ===
                                match.team1Id
                                  ? `${match.team1?.name} (Batting First) *`
                                  : getMatchForm(match.id).battingFirst ===
                                      match.team2Id
                                    ? `${match.team1?.name} (Batting Second) *`
                                    : `${match.team1?.name} *`}
                              </label>
                              <input
                                type="number"
                                placeholder="Runs Scored"
                                className="input mb-2"
                                value={getMatchForm(match.id).team1Score || ""}
                                onChange={(e) =>
                                  updateMatchForm(
                                    match.id,
                                    "team1Score",
                                    e.target.value,
                                  )
                                }
                              />
                              <input
                                type="number"
                                step="0.1"
                                placeholder="Overs Played (e.g. 18.3)"
                                className="input"
                                value={getMatchForm(match.id).team1Overs || ""}
                                onChange={(e) =>
                                  updateMatchForm(
                                    match.id,
                                    "team1Overs",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1 font-medium">
                                {getMatchForm(match.id).battingFirst ===
                                match.team2Id
                                  ? `${match.team2?.name} (Batting First) *`
                                  : getMatchForm(match.id).battingFirst ===
                                      match.team1Id
                                    ? `${match.team2?.name} (Batting Second) *`
                                    : `${match.team2?.name} *`}
                              </label>
                              <input
                                type="number"
                                placeholder="Runs Scored"
                                className="input mb-2"
                                value={getMatchForm(match.id).team2Score || ""}
                                onChange={(e) =>
                                  updateMatchForm(
                                    match.id,
                                    "team2Score",
                                    e.target.value,
                                  )
                                }
                              />
                              <input
                                type="number"
                                step="0.1"
                                placeholder="Overs Played (e.g. 19.5)"
                                className="input"
                                value={getMatchForm(match.id).team2Overs || ""}
                                onChange={(e) =>
                                  updateMatchForm(
                                    match.id,
                                    "team2Overs",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => handleUpdateMatchResult(match.id)}
                            disabled={saving}
                            className="btn btn-primary mt-3 w-full"
                          >
                            💾 Save Result (NRR will be calculated)
                          </button>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Completed Matches */}
              {matches.filter((m) => m.status === "completed").length > 0 && (
                <div className="card p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    ✅ Completed Matches
                  </h2>
                  <div className="space-y-2">
                    {matches
                      .filter((m) => m.status === "completed")
                      .map((match) => (
                        <div
                          key={match.id}
                          className="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded-lg"
                        >
                          <div className="font-medium">
                            {match.team1?.name} {match.team1Score}/
                            {match.team1Overs} vs {match.team2?.name}{" "}
                            {match.team2Score}/{match.team2Overs} (
                            {match.totalOvers} overs)
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs ${getStatusColor(match.status)}`}
                          >
                            {match.winnerTeamId === match.team1Id
                              ? match.team1?.name + " wins"
                              : match.winnerTeamId === match.team2Id
                                ? match.team2?.name + " wins"
                                : "Tie"}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
