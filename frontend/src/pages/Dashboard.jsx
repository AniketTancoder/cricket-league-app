import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import PointsTableDisplay from "./PointsTableDisplay";

export default function Dashboard() {
  const [stats, setStats] = useState({
    teams: 0,
    players: 0,
    matches: 0,
    completedMatches: 0,
    scheduledMatches: 0,
  });
  const [recentResults, setRecentResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [teams, players, matches] = await Promise.all([
        api.getTeams(),
        api.getPlayers(),
        api.getMatches(),
      ]);

      setStats({
        teams: teams.length,
        players: players.length,
        matches: matches.length,
        completedMatches: matches.filter((m) => m.status === "completed")
          .length,
        scheduledMatches: matches.filter((m) => m.status === "scheduled")
          .length,
      });

      // Get recent completed matches
      const completed = matches
        .filter((m) => m.status === "completed")
        .slice(-5)
        .reverse();
      setRecentResults(completed);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Teams",
      value: stats.teams,
      icon: "🏏",
    },
    {
      label: "Players",
      value: stats.players,
      icon: "👥",
    },
    {
      label: "Total Matches",
      value: stats.matches,
      icon: "📅",
    },
    {
      label: "Completed",
      value: stats.completedMatches,
      icon: "✅",
    },
  ];

  return (
    <div>
      {/* Stats - visible on large screens */}
      <div className="hidden lg:grid grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="card p-4 text-center">
            <div className="text-3xl mb-1">{stat.icon}</div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Points Table - Top 4 */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Points Table
            </h2>
            <Link
              to="/points"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All →
            </Link>
          </div>
          <PointsTableDisplay limit={4} />
        </div>

        {/* Recent Results */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Results
            </h2>
            <Link
              to="/fixtures"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {recentResults.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No matches completed yet
              </p>
            ) : (
              recentResults.map((match) => (
                <div key={match.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center text-sm">
                    <div className="font-medium">{match.team1?.name}</div>
                    <div className="text-gray-500">
                      {match.team1Score}/{match.team1Overs}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <div className="font-medium">{match.team2?.name}</div>
                    <div className="text-gray-500">
                      {match.team2Score}/{match.team2Overs}
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    {match.status === "tie" ? (
                      <span className="text-yellow-600 font-medium">
                        Match Tied
                      </span>
                    ) : (
                      <span className="text-green-600 font-medium">
                        {match.winnerTeamId === match.team1Id
                          ? match.team1?.name
                          : match.team2?.name}{" "}
                        Wins
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Stats - visible on small screens only, below points table */}
      <div className="lg:hidden grid grid-cols-2 gap-4 mt-6">
        {statCards.map((stat, index) => (
          <div key={index} className="card p-3 text-center">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <p className="text-xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="card p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          League Progress
        </h2>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-blue-600 h-4 rounded-full transition-all duration-500"
            style={{
              width: `${stats.matches > 0 ? (stats.completedMatches / stats.matches) * 100 : 0}%`,
            }}
          ></div>
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>{stats.completedMatches} Completed</span>
          <span>{stats.scheduledMatches} Scheduled</span>
        </div>
      </div>
    </div>
  );
}
