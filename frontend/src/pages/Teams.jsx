import { useState, useEffect } from "react";
import api from "../services/api";

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const data = await api.getTeams();
      setTeams(data);
    } catch (error) {
      console.error("Failed to load teams:", error);
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Teams</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <div key={team.id} className="card overflow-hidden">
            <div className="h-24 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              {team.logo ? (
                <img 
                  src={team.logo} 
                  alt={team.name} 
                  className="h-20 w-20 object-contain rounded-lg"
                />
              ) : (
                <span className="text-5xl">🏏</span>
              )}
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {team.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {team.players?.length || 0} players
              </p>
              {team.pointsTable && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-blue-600">
                        {team.pointsTable.matches}
                      </p>
                      <p className="text-xs text-gray-500">M</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-green-600">
                        {team.pointsTable.wins}
                      </p>
                      <p className="text-xs text-gray-500">W</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-purple-600">
                        {team.pointsTable.nrr.toFixed(3)}
                      </p>
                      <p className="text-xs text-gray-500">NRR</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {teams.length === 0 && (
        <div className="text-center py-12">
          <span className="text-5xl">🏏</span>
          <p className="mt-4 text-gray-500">No teams yet</p>
        </div>
      )}
    </div>
  );
}
