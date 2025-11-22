import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center space-y-8">
        <h1 className="text-5xl font-bold text-blue-900 tracking-tight">
          Fresh Milk Delivery <br />
          <span className="text-blue-600">Management System</span>
        </h1>

        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Streamline your daily milk requirements. Automated scheduling, monthly billing, and seamless management for companies.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Link
            href="/login"
            className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
          >
            Login to Portal
          </Link>
          <Link
            href="/signup"
            className="px-8 py-4 bg-white text-blue-600 border-2 border-blue-100 rounded-lg font-semibold text-lg hover:border-blue-200 hover:bg-blue-50 transition"
          >
            Register Company
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="p-6 bg-white rounded-xl shadow-sm border border-blue-50">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              📅
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Flexible Scheduling</h3>
            <p className="text-gray-600">Set daily requirements, skip days, or update quantities instantly.</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-sm border border-blue-50">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              💳
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Automated Billing</h3>
            <p className="text-gray-600">Monthly invoices generated automatically based on your consumption.</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-sm border border-blue-50">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              📊
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Consumption Tracking</h3>
            <p className="text-gray-600">View detailed history of your daily milk usage and costs.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
