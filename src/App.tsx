import AdminLayout from "./components/AdminLayout";

export default function App() {
  return (
    <AdminLayout>
      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm h-96 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-800">
          Dashboard Content Goes Here
        </h2>
        <p className="text-gray-500 mt-2">
          Notice how the sidebar beautifully glides over this content when
          hovered!
        </p>
      </div>
    </AdminLayout>
  );
}
