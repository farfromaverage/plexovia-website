import re

with open('app/dashboard/competitors/page.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

state_addition = """  const [search,       setSearch]   = useState("");
  const [isModalOpen,  setIsModalOpen] = useState(false);
  const [newCompetitor, setNewCompetitor] = useState("");
  const [isAdding,     setIsAdding] = useState(false);
  
  const addCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompetitor.trim()) return;
    setIsAdding(true);
    try {
      const res = await fetch("/api/user-competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_names: [newCompetitor.trim()] })
      });
      if (res.ok) {
        setNewCompetitor("");
        setIsModalOpen(false);
        load();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to add competitor");
      }
    } catch (err) {
      alert("An error occurred");
    } finally {
      setIsAdding(false);
    }
  };"""

text = text.replace('  const [search,       setSearch]   = useState("");', state_addition)

button_target = """                  onClick={() => {
                    // Logic to open Add Competitor modal
                    // You can trigger your modal state here. For now, it will act as a placeholder.
                    alert("Add Competitor modal would open here");
                  }}"""
button_replacement = """                  onClick={() => setIsModalOpen(true)}"""

text = text.replace(button_target, button_replacement)

modal_jsx = """
      {/* Add Competitor Modal */}
      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="dash-card" style={{ width: "100%", maxWidth: 400, padding: "2rem", position: "relative" }}>
            <button onClick={() => setIsModalOpen(false)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: "var(--app-muted)" }}>X</button>
            <h2 className="dash-section-h" style={{ marginTop: 0 }}>Add Competitor</h2>
            <p style={{ fontSize: "0.85rem", color: "var(--app-muted)", marginBottom: "1.5rem" }}>
              Enter the exact vendor name as it appears on SAM.gov.
            </p>
            <form onSubmit={addCompetitor}>
              <input 
                type="text" 
                value={newCompetitor} 
                onChange={(e) => setNewCompetitor(e.target.value)} 
                placeholder="e.g. Booz Allen Hamilton" 
                className="dash-input-lg" 
                style={{ width: "100%", marginBottom: "1rem" }}
                autoFocus 
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                <button type="button" className="dash-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="dash-btn dash-btn-primary" disabled={isAdding || !newCompetitor.trim()}>
                  {isAdding ? "Adding..." : "Add Competitor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );"""

text = text.replace('    </div>\n  );\n}', modal_jsx + '\n}')

with open('app/dashboard/competitors/page.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("SUCCESS")
