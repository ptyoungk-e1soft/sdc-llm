"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Users } from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  isActive: boolean;
}

interface UserGroup {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  _count: { users: number };
  users?: User[];
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/admin/groups");
      const data = await res.json();
      setGroups(data);
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupUsers = async (groupId: string) => {
    try {
      const res = await fetch(`/api/admin/groups/${groupId}`);
      const data = await res.json();
      setSelectedGroup(data);
      setShowUsersModal(true);
    } catch (error) {
      console.error("Error fetching group users:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = editingGroup
      ? `/api/admin/groups/${editingGroup.id}`
      : "/api/admin/groups";
    const method = editingGroup ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowModal(false);
        resetForm();
        fetchGroups();
      }
    } catch (error) {
      console.error("Error saving group:", error);
    }
  };

  const handleEdit = (group: UserGroup) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (groupId: string) => {
    if (!confirm("Are you sure you want to delete this group?")) return;

    try {
      await fetch(`/api/admin/groups/${groupId}`, { method: "DELETE" });
      fetchGroups();
    } catch (error) {
      console.error("Error deleting group:", error);
    }
  };

  const resetForm = () => {
    setEditingGroup(null);
    setFormData({
      name: "",
      description: "",
    });
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Groups</h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Group
        </button>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => (
          <div
            key={group.id}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {group.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {group.description || "No description"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(group)}
                  className="text-blue-600 hover:text-blue-900"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(group.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {group._count.users} member{group._count.users !== 1 ? "s" : ""}
              </span>
              <button
                onClick={() => fetchGroupUsers(group.id)}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
              >
                <Users className="w-4 h-4" />
                View Members
              </button>
            </div>
          </div>
        ))}

        {groups.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500">
            No groups created yet. Click "Add Group" to create one.
          </div>
        )}
      </div>

      {/* Add/Edit Group Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {editingGroup ? "Edit Group" : "Add Group"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingGroup ? "Save" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Group Users Modal */}
      {showUsersModal && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {selectedGroup.name} - Members
              </h2>
              <button
                onClick={() => setShowUsersModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedGroup.users && selectedGroup.users.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {selectedGroup.users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {user.name || user.email}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          user.role === "ADMIN"
                            ? "bg-red-100 text-red-800"
                            : user.role === "USER"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {user.role}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          user.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No members in this group
              </p>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowUsersModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
