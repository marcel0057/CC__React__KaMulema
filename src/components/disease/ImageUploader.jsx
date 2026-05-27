import { useEffect, useState } from "react";

export default function ImageUploader({ value, onChange }) {
  const [previewUrls, setPreviewUrls] = useState([]);

  useEffect(() => {
    if (!value?.length) {
      setPreviewUrls([]);
      return;
    }

    const urls = value.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [value]);

  function addPhotos(fileList) {
    const selectedFiles = Array.from(fileList || []).filter((file) => file.type.startsWith("image/"));
    const nextFiles = [...value, ...selectedFiles].slice(0, 5);
    onChange(nextFiles);
  }

  function removePhoto(indexToRemove) {
    onChange(value.filter((_, index) => index !== indexToRemove));
  }

  return (
    <section className="surface">
      <div className="section-title-row">
        <div>
          <h2>Photos de la plante</h2>
          <p>Ajoutez plusieurs angles : feuille, tige, fruit, racine ou vue generale.</p>
        </div>
      </div>

      <label className="upload-zone">
        <input
          accept="image/png,image/jpeg,image/webp"
          multiple
          type="file"
          onChange={(event) => {
            addPhotos(event.target.files);
            event.target.value = "";
          }}
        />
        <span className="upload-placeholder">
          <strong>Ajouter des photos nettes</strong>
          <small>Jusqu'a 5 images pour ameliorer le diagnostic</small>
        </span>
      </label>

      {previewUrls.length > 0 && (
        <div className="photo-grid" aria-label="Photos selectionnees">
          {previewUrls.map((url, index) => (
            <article className="photo-preview" key={`${value[index].name}-${url}`}>
              <img src={url} alt={`Apercu plante ${index + 1}`} />
              <div>
                <span>{value[index].name}</span>
                <button type="button" onClick={() => removePhoto(index)}>
                  Retirer
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="file-meta">
        <span>{value.length} image{value.length > 1 ? "s" : ""} selectionnee{value.length > 1 ? "s" : ""}</span>
        <span>Maximum 5</span>
      </div>
    </section>
  );
}
