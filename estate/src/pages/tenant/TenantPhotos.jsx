import { useEffect, useState } from "react";
import { tenantAPI } from "../../api";

export default function TenantPhotos() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      const response = await tenantAPI.getPhotos();
      setPhotos(response.data);
    } catch (error) {
      console.error("Failed to load photos:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const housePhotos = photos.filter(p => p.photo_type === "house");
  const landingPhotos = photos.filter(p => p.photo_type === "landing");

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Photos & Gallery</h1>

      {/* House Photos */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-green-600">My House</h2>
        {housePhotos.length === 0 ? (
          <div className="card">
            <p className="text-gray-600">No house photos available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {housePhotos.map((photo) => (
              <div key={photo.id} className="card p-0 overflow-hidden">
                <img
                  src={photo.url}
                  alt={photo.caption || "House photo"}
                  className="w-full h-64 object-cover"
                />
                {photo.caption && (
                  <div className="p-4">
                    <p className="text-gray-700">{photo.caption}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(photo.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Estate Photos */}
      {landingPhotos.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-600">Estate Gallery</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {landingPhotos.map((photo) => (
              <div key={photo.id} className="card p-0 overflow-hidden">
                <img
                  src={photo.url}
                  alt={photo.caption || "Estate photo"}
                  className="w-full h-64 object-cover"
                />
                {photo.caption && (
                  <div className="p-4">
                    <p className="text-gray-700">{photo.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {photos.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-600">No photos available</p>
        </div>
      )}
    </div>
  );
}
