import { useState, useEffect } from "react";
import api from "../services/api";

export default function Fixtures() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const data = await api.getMatches();
      setMatches(data);
    } catch (error) {
      console.error("Failed to load matches:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "in_progress":
        return "bg-blue-100 text-blue-700";
      case "scheduled":
        return "bg-gray-100 text-gray-700";
      case "abandoned":
        return "bg-red-100 text-red-700";
      case "tie":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatDate = (date) => {
    if (!date) return "TBD";
    return new Date(date).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });
  };

  const filteredMatches = matches.filter((match) => {
    if (filter === "all") return true;
    return match.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fixtures</h1>
        <div className="flex gap-2">
          {["all", "scheduled", "completed", "tie"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                filter === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredMatches.map((match) => (
          <div key={match.id} className="card p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-center min-w-[80px]">
                  <p className="text-xs text-gray-500">
                    {formatDate(match.matchDate)}
                  </p>
                  <p className="text-xs text-gray-400">{match.matchTime}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {match.team1?.name}
                    </p>
                  </div>
                  <span className="text-2xl">🏏</span>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">
                      {match.team2?.name}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {match.status === "completed" && (
                  <div className="text-sm">
                    <span className="font-medium">{match.team1Score}</span>
                    <span className="text-gray-400 mx-1">/</span>
                    <span className="text-gray-500">({match.team1Overs})</span>
                    <span className="mx-2 text-gray-400">vs</span>
                    <span className="font-medium">{match.team2Score}</span>
                    <span className="text-gray-400 mx-1">/</span>
                    <span className="text-gray-500">({match.team2Overs})</span>
                  </div>
                )}
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(match.status)}`}
                >
                  {match.status === "league" ? "League" : match.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredMatches.length === 0 && (
        <div className="text-center py-12">
          <span className="text-5xl">📅</span>
          <p className="mt-4 text-gray-500">No matches found</p>
        </div>
      )}
    </div>
  );
}
