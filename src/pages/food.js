import { useState } from "react";
import { useRouter } from "next/router";

export default function AddFood() {
  const [name, setName] = useState("");
  const [img, setImg] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/food/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, img }),
    });
    if (res.ok) {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-white text-xl mb-4">Add Food Item</h2>
        <input
          type="text"
          placeholder="Food Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="p-2 rounded w-full mb-2"
        />
        <input
          type="text"
          placeholder="Image URL"
          value={img}
          onChange={(e) => setImg(e.target.value)}
          className="p-2 rounded w-full mb-2"
        />
        <button type="submit" className="bg-orange-500 px-4 py-2 rounded text-white">
          Add Food
        </button>
      </form>
    </div>
  );
}
