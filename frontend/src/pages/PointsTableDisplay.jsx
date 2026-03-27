import { useState, useEffect, useMemo } from "react";
import api from "../services/api";

export default function PointsTableDisplay({
  limit = null,
  showExport = false,
}) {
  const [pointsTable, setPointsTable] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("points");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    loadPointsTable();
  }, []);

  const loadPointsTable = async () => {
    try {
      const [pointsData, matchesData] = await Promise.all([
        api.getPointsTable(),
        api.getMatches(),
      ]);
      setPointsTable(pointsData);
      setMatches(matchesData);
    } catch (error) {
      console.error("Failed to load points table:", error);
    } finally {
      setLoading(false);
    }
  };

  // Check if all league matches are completed
  const allMatchesCompleted =
    matches.length > 0 &&
    matches.every(
      (m) =>
        m.status === "completed" ||
        m.status === "tie" ||
        m.status === "abandoned",
    );

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const sortedTable = useMemo(() => {
    if (sortBy === "points" && sortOrder === "desc") {
      return [...pointsTable];
    }

    const sorted = [...pointsTable].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === "team") {
        aVal = a.team.name;
        bVal = b.team.name;
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });
    return sorted;
  }, [pointsTable, sortBy, sortOrder]);

  const displayTable = limit ? sortedTable.slice(0, limit) : sortedTable;

  const exportToExcel = () => {
    const headers = [
      "Rank",
      "Team",
      "Matches",
      "Wins",
      "Losses",
      "Ties",
      "Points",
      "NRR",
    ];
    const rows = displayTable.map((team) => [
      team.rank,
      team.team.name,
      team.matches,
      team.wins,
      team.losses,
      team.ties,
      team.points,
      team.nrr.toFixed(3),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "points_table.csv";
    link.click();
  };

  const getRowClass = (team) => {
    // Only show Qualified/Eliminated colors when all matches are completed
    if (!allMatchesCompleted) {
      return team.rank <= 4 ? "bg-yellow-50 border-yellow-200" : "";
    }
    if (team.qualified) return "bg-green-50 border-green-200";
    if (team.eliminated) return "bg-red-50 border-red-100";
    return "";
  };

  const getStatusBadge = (team) => {
    // If not all matches completed, show "In Play"
    if (!allMatchesCompleted) {
      return (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
          In Play
        </span>
      );
    }

    // After all matches completed, show Qualified or Eliminated
    if (team.qualified) {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
          Qualified
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
        Eliminated
      </span>
    );
  };

  const SortIcon = ({ column }) => {
    if (sortBy !== column) return <span className="ml-1 text-gray-400">↕</span>;
    return sortOrder === "asc" ? (
      <span className="ml-1">↑</span>
    ) : (
      <span className="ml-1">↓</span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={limit ? "" : "card p-6"}>
      {!limit && (
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Points Table</h1>
          {showExport && (
            <button
              onClick={exportToExcel}
              className="btn btn-primary h-[30px] text-sm"
            >
              Download Points Table
            </button>
          )}
        </div>
      )}

      <div className="overflow-x-auto w-full">
        <table className="min-w-full text-sm whitespace-nowrap">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase w-10">
                #
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase w-12"></th>
              <th
                className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700"
                onClick={() => handleSort("team")}
              >
                Team <SortIcon column="team" />
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase w-12">
                M
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase w-10">
                W
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase w-10">
                L
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase w-10">
                T
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase w-12">
                Pts
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase w-16">
                NRR
              </th>
              {!limit && (
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase w-20">
                  Status
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {displayTable.map((team) => (
              <tr
                key={team.id}
                className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${getRowClass(
                  team,
                )}`}
              >
                <td className="px-2 py-2 font-medium text-gray-900">
                  {team.rank}
                </td>
                <td className="px-2 py-2 text-center">
                  {team.team.logo ? (
                    <img
                      src={team.team.logo}
                      alt="Logo"
                      className="w-10 h-10 mx-auto rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 mx-auto rounded-lg bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                      -
                    </div>
                  )}
                </td>
                <td className="px-2 py-2 font-medium text-gray-900 min-w-[100px]">
                  {team.team.name}
                </td>
                <td className="px-2 py-2 text-center text-gray-600">
                  {team.matches}
                </td>
                <td className="px-2 py-2 text-center text-green-600 font-medium">
                  {team.wins}
                </td>
                <td className="px-2 py-2 text-center text-red-600 font-medium">
                  {team.losses}
                </td>
                <td className="px-2 py-2 text-center text-gray-600">
                  {team.ties}
                </td>
                <td className="px-2 py-2 text-center font-bold text-blue-600">
                  {team.points}
                </td>
                <td className="px-2 py-2 text-center font-medium text-purple-600">
                  {team.nrr > 0 ? "+" : ""}
                  {team.nrr.toFixed(3)}
                </td>
                {!limit && (
                  <td className="px-2 py-2 text-center">
                    {getStatusBadge(team)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!limit && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
          <div className="card p-2 sm:p-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-100 border border-yellow-200 rounded flex-shrink-0"></span>
              <span className="text-xs sm:text-sm text-gray-600">In Play</span>
            </div>
          </div>
          <div className="card p-2 sm:p-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 sm:w-4 sm:h-4 bg-green-100 border border-green-200 rounded flex-shrink-0"></span>
              <span className="text-xs sm:text-sm text-gray-600">
                Qualified (Top 4 with ≥3 wins)
              </span>
            </div>
          </div>
          <div className="card p-2 sm:p-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 sm:w-4 sm:h-4 bg-red-50 border border-red-100 rounded flex-shrink-0"></span>
              <span className="text-xs sm:text-sm text-gray-600">
                Eliminated
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
