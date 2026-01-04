import Link from "next/link";
import prisma from "@/lib/prisma";

export default async function AdminPage() {
  const [userCount, chatCount, messageCount] = await Promise.all([
    prisma.user.count(),
    prisma.chat.count(),
    prisma.message.count(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Total Users</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {userCount}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Total Chats</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {chatCount}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">
            Total Messages
          </div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {messageCount}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/admin/users"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            User Management
          </h2>
          <p className="text-gray-600">
            Create, edit, and manage user accounts and permissions.
          </p>
        </Link>
        <Link
          href="/admin/settings"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            LLM Settings
          </h2>
          <p className="text-gray-600">
            Configure default model, temperature, and other LLM options.
          </p>
        </Link>
      </div>
    </div>
  );
}
