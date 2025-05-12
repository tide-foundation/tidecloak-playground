// app/components/Spinner.js
export default function Spinner() {
    return (
      <div className="sk-cube-grid">
        {[...Array(9)].map((_, i) => (
          <div key={i} className={`sk-cube sk-cube${i + 1}`}></div>
        ))}
      </div>
    );
  }
  