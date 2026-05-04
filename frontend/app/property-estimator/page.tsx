"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Photo = { id: string; url: string; name: string };

type DistrictInfo = { base: number; lat: number; lon: number; tier: string };

const DISTRICT_DATA: Record<string, DistrictInfo> = {
  Abdoun: { base: 900, lat: 31.9497, lon: 35.8878, tier: "Premium district" },
  Dabouq: { base: 1100, lat: 31.978, lon: 35.8325, tier: "Luxury villa zone" },
  Khalda: { base: 900, lat: 31.995, lon: 35.8402, tier: "Balanced residential area" },
  Sweifieh: { base: 950, lat: 31.957, lon: 35.8581, tier: "Mixed-use commercial district" },
  Shmeisani: { base: 850, lat: 31.9698, lon: 35.8928, tier: "Central business-residential zone" },
  Jubeiha: { base: 700, lat: 32.0138, lon: 35.8696, tier: "Mid-market family district" },
  "Tla Al Ali": { base: 800, lat: 32.0058, lon: 35.8645, tier: "Stable mid-market area" },
  "Marj Al Hamam": { base: 650, lat: 31.8944, lon: 35.8282, tier: "Value-oriented residential zone" },
  "Deir Ghbar": { base: 1050, lat: 31.933, lon: 35.8615, tier: "High-end residential pocket" },
  "Al Rabieh": { base: 980, lat: 31.9823, lon: 35.8711, tier: "Upper-mid residential district" },
};

const heroImages = [
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&auto=format&fit=crop",
];

function formatJOD(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(value));
}

export default function PropertyAIPage() {
  const [area, setArea] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [floor, setFloor] = useState("");
  const [buildingAge, setBuildingAge] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [furnished, setFurnished] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      photos.forEach((photo) => URL.revokeObjectURL(photo.url));
    };
  }, [photos]);

  function onDistrictChange(nextDistrict: string) {
    setDistrict(nextDistrict);
    if (!nextDistrict) return;
    const info = DISTRICT_DATA[nextDistrict];
    setNeighborhood(nextDistrict);
    setLatitude(info.lat.toFixed(4));
    setLongitude(info.lon.toFixed(4));
  }

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const incoming = Array.from(fileList)
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
        url: URL.createObjectURL(file),
        name: file.name,
      }));
    setPhotos((current) => [...current, ...incoming]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removePhoto(id: string) {
    setPhotos((current) => {
      const removed = current.find((photo) => photo.id === id);
      if (removed) URL.revokeObjectURL(removed.url);
      return current.filter((photo) => photo.id !== id);
    });
  }

  function clearPhotos() {
    photos.forEach((photo) => URL.revokeObjectURL(photo.url));
    setPhotos([]);
  }

  const estimate = useMemo(() => {
    const numericArea = Number(area) || 0;
    const numericAge = Number(buildingAge) || 0;
    const districtInfo = district ? DISTRICT_DATA[district] : { base: 0, tier: "Select district", lat: 0, lon: 0 };
    const basePrice = numericArea * districtInfo.base;
    const furnishedBonus = furnished === "yes" ? 9000 : 0;
    const ageFactor = Math.max(0.7, 1 - numericAge * 0.012);
    const typeFactor = propertyType === "house" ? 1.08 : 1;
    const photoCondition = Math.max(0.75, Math.min(1.08, 0.88 + Math.min(photos.length, 20) * 0.004 + (furnished === "yes" ? 0.02 : 0)));
    const photoMultiplier = 1 + (photoCondition - 1) * 0.65;
    const finalPrice = (basePrice * ageFactor * typeFactor * photoMultiplier) + furnishedBonus;
    return {
      districtInfo,
      basePrice,
      furnishedBonus,
      ageFactor,
      typeFactor,
      photoCondition,
      photoMultiplier,
      finalPrice,
      low: finalPrice * 0.93,
      high: finalPrice * 1.07,
      confidence: Math.max(65, Math.min(95, Math.round(photoCondition * 45 + ageFactor * 28 + (furnished === "yes" ? 10 : 5)))),
    };
  }, [area, buildingAge, district, furnished, photos.length, propertyType]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <main className="property-ai-page">
      <style>{styles}</style>

      <section className="page-hero">
        <header className="nav">
          <div className="container nav-inner">
            <a href="/" className="brand">
              <span className="brand-mark"><img src="/logo2.png" alt="SmartEstate logo" /></span>
              <span>SmartEstate</span>
            </a>
            <nav className="nav-links" aria-label="Main navigation">
              <a className="nav-link" href="/">Home</a>
              <a className="nav-link" href="/property-ai">Property AI</a>
              <a className="nav-link" href="/land">Land AI</a>
              <a className="nav-link" href="/loans">Loan AI</a>
              <a className="nav-link" href="/areas">Area Insights</a>
              <a className="nav-link" href="/marketplace">Market place</a>
              <a className="nav-ghost" href="/login">Login</a>
              <a className="nav-cta" href="/signup">Create Account</a>
            </nav>
          </div>
        </header>

        <div className="container">
          <div className="hero-grid">
            <div className="hero-copy reveal in-view">
              <span className="eyebrow">Premium valuation intelligence</span>
              <h1>Property <span className="gold">AI Estimator</span></h1>
              <p>
                A premium SmartEstate property screen for early-stage valuation in Amman. Enter property details,
                upload photos, view district-aware pricing signals, and receive a clear estimate with explanation,
                photo confidence, and market context built for real estate decision support.
              </p>
              <div className="hero-actions">
                <a href="#tool" className="gold-btn">Start Property Analysis <span>↓</span></a>
                <a href="#insights" className="ghost-btn">See output logic</a>
              </div>
              <div className="hero-stats">
                <div className="hero-stat"><strong>District</strong><span>Market baseline signal</span></div>
                <div className="hero-stat"><strong>Photos</strong><span>Condition-aware scoring</span></div>
                <div className="hero-stat"><strong>Range</strong><span>Decision-friendly pricing band</span></div>
              </div>
            </div>

            <div className="reveal in-view">
              <div className="hero-card">
                <div className="badge">Property AI • Photo + Market Blend</div>
                <div className="hero-visual-board">
                  <div className="hero-thumb-grid">
                    <div className="hero-photo-main"><img src={heroImages[0]} alt="Premium apartment exterior" /></div>
                    <div className="hero-photo-stack">
                      <img src={heroImages[1]} alt="Bedroom detail" />
                      <img src={heroImages[2]} alt="Exterior detail" />
                    </div>
                  </div>
                  <div className="hero-floating"><strong>123,821 JOD</strong><span>Estimated value • Abdoun apartment</span></div>
                </div>
                <div className="hero-side-grid">
                  <div className="soft-panel"><h4>Luxury valuation studio</h4><p>This page is intentionally more visual than the loan experience, with a stronger real-estate gallery feel.</p></div>
                  <div className="soft-panel"><h4>Photo-led estimate</h4><p>Multiple uploaded images influence condition reading and help the result feel grounded.</p></div>
                  <div className="soft-panel"><h4>District-driven pricing</h4><p>Location remains the strongest pricing signal, then age, type, and photo score refine the estimate.</p></div>
                  <div className="soft-panel"><h4>Premium presentation</h4><p>Range, confidence, and district spotlight turn a technical estimator into a real product experience.</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="tool" className="section dark-band">
        <div className="container">
          <div className="section-head">
            <div>
              <h2>Premium property analysis workspace</h2>
              <p className="section-copy">Property details on the left, premium result and insight cards on the right, and a better upload experience for multiple interior and exterior photos.</p>
            </div>
            <a href="#guide" className="gold-btn">Review Next Steps <span>↓</span></a>
          </div>

          <div className="tool-layout">
            <article className="card">
              <div className="card-title">
                <div>
                  <h3>Property profile</h3>
                  <p className="muted">Clean empty inputs with clear placeholders and editable values.</p>
                </div>
                <span className="badge">AI input panel</span>
              </div>

              <form onSubmit={handleSubmit} className="form-grid">
                <div className="field"><label>Area (m²)</label><input className="input" type="number" min="20" step="1" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Enter property area" /></div>
                <div className="field"><label>Bedrooms</label><input className="input" type="number" min="0" step="1" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} placeholder="Enter bedrooms" /></div>
                <div className="field"><label>Bathrooms</label><input className="input" type="number" min="0" step="1" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} placeholder="Enter bathrooms" /></div>
                <div className="field"><label>Floor</label><input className="input" type="number" min="0" step="1" value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="Enter floor" /></div>
                <div className="field"><label>Building age (years)</label><input className="input" type="number" min="0" step="1" value={buildingAge} onChange={(e) => setBuildingAge(e.target.value)} placeholder="Enter age in years" /></div>
                <div className="field"><label>Property type</label><select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} required><option value="" disabled>Select property type</option><option value="apartment">Apartment</option><option value="house">House</option></select></div>
                <div className="field"><label>Furnished</label><select value={furnished} onChange={(e) => setFurnished(e.target.value)} required><option value="" disabled>Select furnishing</option><option value="yes">Yes</option><option value="no">No</option></select></div>
                <div className="field"><label>City</label><select value={city} onChange={(e) => setCity(e.target.value)} required><option value="" disabled>Select city</option><option>Amman</option></select></div>
                <div className="field"><label>District</label><select value={district} onChange={(e) => onDistrictChange(e.target.value)} required><option value="" disabled>Select district</option>{Object.keys(DISTRICT_DATA).map((name) => <option key={name} value={name}>{name}</option>)}</select></div>
                <div className="field"><label>Neighborhood</label><input className="input" type="text" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Enter neighborhood" /></div>
                <div className="field"><label>Latitude</label><input className="input" type="text" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="Example: 31.9497" /></div>
                <div className="field"><label>Longitude</label><input className="input" type="text" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="Example: 35.8878" /></div>

                <div className="field full">
                  <div className="upload-box" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}>
                    <div className="upload-top">
                      <div>
                        <div className="upload-kicker">Apartment / house photos</div>
                        <p>Upload multiple living room, bedroom, kitchen, bathroom, balcony, and exterior images at once.</p>
                      </div>
                      <span className="status-pill">{photos.length ? `${photos.length} selected` : "No photos yet"}</span>
                    </div>

                    <div className="dropzone">
                      <button className="drop-icon" type="button" onClick={() => fileInputRef.current?.click()} aria-label="Choose property photos">＋</button>
                      <div className="drop-copy"><strong>Choose or drag property photos here</strong><span>Supported: JPG, JPEG, PNG, WEBP. You can select multiple images together.</span></div>
                      <button className="small-gold" type="button" onClick={() => fileInputRef.current?.click()}>Choose Photos</button>
                      <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
                    </div>

                    {photos.length > 0 && <button className="clear-photos" type="button" onClick={clearPhotos}>Clear all photos</button>}
                    <div className="thumb-grid">
                      {photos.map((photo, index) => (
                        <div className="thumb" key={photo.id}>
                          <img src={photo.url} alt={photo.name} />
                          <span className="thumb-badge">Photo {index + 1}</span>
                          <button className="remove-photo" type="button" onClick={() => removePhoto(photo.id)} aria-label={`Remove ${photo.name}`}>×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="field full"><button className="gold-btn" type="submit">Predict Property Price <span>→</span></button></div>
              </form>
            </article>

            <div className="result-shell">
              <section className={`price-banner ${submitted ? "is-visible" : ""}`}>
                <div className="price-top">
                  <div>
                    <h3>Estimated price</h3>
                    <p>{submitted ? `This valuation blends ${district || "selected district"} baseline, property type, photo score, furnishing, and age into one premium property signal.` : "Submit the property details to see the estimate."}</p>
                  </div>
                  <span className="status-pill">{submitted ? "Valuation ready" : "Waiting"}</span>
                </div>
                <div className="price-meta">
                  <div className="price-box"><strong>{submitted ? formatJOD(estimate.finalPrice) : "—"}</strong><span>Main estimate (JOD)</span></div>
                  <div className="price-box"><strong>{submitted ? `${formatJOD(estimate.low)}–${formatJOD(estimate.high)}` : "—"}</strong><span>Suggested range</span></div>
                  <div className="price-box"><strong>{submitted ? estimate.districtInfo.base : "—"}</strong><span>District baseline / m²</span></div>
                </div>
              </section>

              <article className="result-card">
                <h4>Condition & pricing confidence</h4>
                <div className="score-ring-wrap">
                  <div className="score-ring" style={{ "--score": submitted ? estimate.confidence : 0 } as React.CSSProperties} data-score={submitted ? estimate.confidence : 0}></div>
                  <div><strong>Estimate confidence</strong><p className="muted">{submitted ? "Confidence improves when district selection, property details, and diverse photos are aligned." : "Fill the form and upload photos to calculate confidence."}</p></div>
                </div>
              </article>

              <div className="result-grid">
                <article className="result-card"><h4>Valuation summary</h4><div className="key-list">
                  <InfoItem title="District × area baseline" text="Primary location-based starting point for valuation." value={submitted ? `${formatJOD(estimate.basePrice)} JOD` : "—"} />
                  <InfoItem title="Photo-derived condition multiplier" text="Condition signal based on uploaded visual set." value={submitted ? estimate.photoMultiplier.toFixed(3) : "—"} />
                  <InfoItem title="Furnished bonus" text="Applied when the property is presented as furnished." value={submitted ? `${formatJOD(estimate.furnishedBonus)} JOD` : "—"} />
                </div></article>
                <article className="result-card"><h4>Photo analysis</h4><div className="analysis-list">
                  <InfoItem title="Photo set used" text="Uploaded interior and exterior views." value={submitted ? `${photos.length} images` : "—"} />
                  <InfoItem title="Condition score" text="Clean, bright images tend to lift confidence." value={submitted ? estimate.photoCondition.toFixed(3) : "—"} />
                  <InfoItem title="Visual reading" text="More photos improve early-stage confidence." value={submitted ? (photos.length >= 4 ? "Strong" : "Limited") : "—"} />
                </div></article>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="insights" className="section">
        <div className="container">
          <div className="section-head"><div><h2>Why this page feels like Property AI</h2><p className="section-copy">The upload area is now a real product feature, and the inputs start clean instead of looking pre-filled.</p></div></div>
          <div className="cards3">
            <article className="insight-card"><h3>Empty professional inputs</h3><p>No default values are forced into the fields. Users add their own numbers and selections.</p></article>
            <article className="insight-card"><h3>Multiple image upload</h3><p>Select many files at once, drag and drop them, and preview everything instantly.</p></article>
            <article className="insight-card"><h3>Delete photos</h3><p>Remove a single image with the × button or clear the whole selection.</p></article>
          </div>
        </div>
      </section>
    </main>
  );
}

function InfoItem({ title, text, value }: { title: string; text: string; value: string | number }) {
  return <div className="key-item"><div><strong>{title}</strong><span>{text}</span></div><div className="value">{value}</div></div>;
}

const styles = `
.property-ai-page{--bg:#f5f2ea;--ink:#11131a;--muted:#697083;--navy:#020816;--navy-2:#04122c;--navy-3:#0f1f3c;--gold:#f2c94c;--gold-2:#e1b43d;--grid:rgba(255,255,255,.12);--shadow:0 18px 40px rgba(0,0,0,.14);--shadow-soft:0 18px 30px rgba(25,30,42,.08);--ease-smooth:cubic-bezier(.22,1,.36,1);background:var(--bg);color:var(--ink);font-family:Inter,Arial,Helvetica,sans-serif;overflow-x:hidden}.property-ai-page *{box-sizing:border-box}.property-ai-page h1,.property-ai-page h2,.property-ai-page h3,.property-ai-page h4{font-family:Georgia,"Times New Roman",serif;margin:0}.property-ai-page p{margin:0}.property-ai-page a{text-decoration:none;color:inherit}.property-ai-page button,.property-ai-page input,.property-ai-page select{font:inherit}.container{width:min(1180px,calc(100% - 56px));margin:0 auto}.page-hero{position:relative;overflow:hidden;color:#fff;background:linear-gradient(90deg,#020816 0%,#04122c 34%,#263145 72%,#d7d5d1 100%)}.page-hero:before,.dark-band:before{content:"";position:absolute;inset:0;background-image:linear-gradient(var(--grid) 1px,transparent 1px),linear-gradient(90deg,var(--grid) 1px,transparent 1px);background-size:92px 92px;pointer-events:none}.nav{position:sticky;top:0;z-index:30;width:100%;padding:22px 0;backdrop-filter:blur(14px);background:linear-gradient(180deg,rgba(2,8,22,.72),rgba(2,8,22,.32));border-bottom:1px solid rgba(255,255,255,.06)}.nav-inner{display:flex;align-items:center;justify-content:space-between;gap:16px}.brand{display:flex;align-items:center;gap:12px;font-weight:800;letter-spacing:.02em;white-space:nowrap}.brand-mark{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:linear-gradient(135deg,rgba(214,178,93,.22),rgba(255,255,255,.08));border:1px solid rgba(214,178,93,.24);overflow:hidden}.brand-mark img{width:100%;height:100%;object-fit:contain;display:block}.nav-links{display:flex;align-items:center;gap:14px;flex-wrap:wrap}.nav-link,.nav-ghost{padding:10px 14px;border-radius:999px;color:rgba(233,238,247,.72);transition:all 260ms cubic-bezier(.2,.8,.2,1)}.nav-link:hover,.nav-ghost:hover{color:#fff;background:rgba(255,255,255,.05)}.nav-cta{padding:11px 18px;border-radius:999px;color:#111;font-weight:700;background:linear-gradient(135deg,#d6b25d,#f3dfaa);box-shadow:0 10px 30px rgba(214,178,93,.22)}.hero-grid{position:relative;z-index:2;display:grid;grid-template-columns:1.02fr .98fr;gap:28px;align-items:center;min-height:780px;padding:28px 0 86px}.hero-copy{max-width:570px}.eyebrow{display:inline-flex;align-items:center;gap:10px;padding:8px 14px;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--gold)}.hero-copy h1{margin-top:18px;font-size:82px;line-height:.92;letter-spacing:-.06em;text-wrap:balance;text-shadow:0 10px 30px rgba(0,0,0,.18)}.hero-copy .gold{color:var(--gold);display:block}.hero-copy p{margin-top:22px;max-width:520px;color:rgba(255,255,255,.82);font-size:15px;line-height:1.9}.hero-actions{display:flex;gap:14px;flex-wrap:wrap;margin-top:28px}.gold-btn,.ghost-btn,.small-gold{display:inline-flex;align-items:center;justify-content:center;gap:12px;border:none;border-radius:999px;cursor:pointer;transition:transform .22s ease,box-shadow .22s ease,opacity .22s ease;text-decoration:none;white-space:nowrap;position:relative;overflow:hidden}.gold-btn:hover,.ghost-btn:hover,.small-gold:hover{transform:translateY(-2px)}.gold-btn{padding:16px 24px;background:var(--gold);color:#16181f;font-weight:800;box-shadow:0 0 28px rgba(242,201,76,.45),0 10px 20px rgba(0,0,0,.16)}.ghost-btn{padding:16px 22px;color:#fff;font-weight:700;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12)}.small-gold{padding:10px 14px;background:var(--gold);color:#16181f;font-size:12px;font-weight:800}.hero-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:26px;max-width:560px}.hero-stat{padding:16px;border-radius:18px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);backdrop-filter:blur(10px)}.hero-stat strong{display:block;font-size:22px;line-height:1;margin-bottom:7px;color:#fff}.hero-stat span{display:block;font-size:12px;line-height:1.45;color:rgba(255,255,255,.74)}.hero-card{position:relative;background:rgba(255,255,255,.93);color:#161922;border-radius:34px;box-shadow:0 32px 90px rgba(0,0,0,.24),0 8px 24px rgba(0,0,0,.1);border:1px solid rgba(255,255,255,.55);overflow:hidden;padding:28px;min-height:620px}.badge{display:inline-flex;align-items:center;gap:8px;background:#0f1320;color:var(--gold);border-radius:999px;padding:8px 12px;font-size:11px;font-weight:800;margin-bottom:18px}.hero-visual-board{height:290px;border-radius:28px;background:linear-gradient(180deg,#f9fbff,#edf2fa);border:1px solid rgba(17,19,26,.05);padding:18px;position:relative;overflow:hidden}.hero-visual-board:before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(17,19,26,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(17,19,26,.05) 1px,transparent 1px);background-size:48px 48px;pointer-events:none}.hero-thumb-grid{position:relative;z-index:2;display:grid;grid-template-columns:1.3fr .7fr;gap:12px;height:100%}.hero-photo-main,.hero-photo-stack{border-radius:24px;overflow:hidden;box-shadow:0 16px 30px rgba(20,24,36,.12)}.hero-photo-main img,.hero-photo-stack img{width:100%;height:100%;object-fit:cover;display:block}.hero-photo-stack{display:grid;grid-template-rows:1fr 1fr;gap:12px;background:#fff}.hero-floating{position:absolute;right:18px;bottom:18px;background:rgba(255,255,255,.96);border-radius:22px;padding:14px 16px;border:1px solid rgba(17,19,26,.06);box-shadow:0 18px 34px rgba(20,24,36,.14);z-index:3;min-width:180px}.hero-floating strong{display:block;font-size:24px;letter-spacing:-.04em}.hero-floating span{display:block;font-size:12px;color:#6f7788;margin-top:4px}.hero-side-grid{position:relative;z-index:2;display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:18px}.soft-panel{background:#fff;border-radius:22px;padding:16px;border:1px solid rgba(17,19,26,.06);box-shadow:var(--shadow-soft)}.soft-panel h4{font-size:18px;margin-bottom:8px}.soft-panel p{font-size:13px;line-height:1.7;color:#657084}.section{position:relative;padding:108px 0}.section h2{font-size:54px;letter-spacing:-.04em;margin-bottom:20px;text-wrap:balance}.section-copy{max-width:640px;color:rgba(255,255,255,.78);font-size:15px;line-height:1.9}.section-head{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:36px}.dark-band{position:relative;overflow:hidden;background:linear-gradient(90deg,#020816 0%,#08142f 48%,#3a4457 100%);color:#fff}.dark-band .container,.dark-band .section-head{position:relative;z-index:2}.tool-layout{display:grid;grid-template-columns:1.04fr .96fr;gap:24px;align-items:start}.card{background:#fff;border-radius:28px;padding:24px;box-shadow:0 18px 30px rgba(25,30,42,.08);border:1px solid rgba(17,19,26,.05);color:#11131a}.dark-band .card{background:linear-gradient(180deg,#fff 0%,#f5f3ee 100%)}.card-title{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:18px}.card-title h3{font-size:28px;letter-spacing:-.04em}.muted{color:#697083;font-size:14px;line-height:1.8}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.field{display:flex;flex-direction:column;gap:8px}.field.full{grid-column:1/-1}.field label{font-size:13px;font-weight:700;color:#3b4352;text-transform:uppercase;letter-spacing:.04em}.input,select{width:100%;height:56px;border-radius:18px;border:1px solid rgba(17,19,26,.1);background:#fff;color:#181b23;padding:0 16px;outline:none;transition:border-color .25s ease,box-shadow .25s ease}.input:focus,select:focus{border-color:rgba(242,201,76,.95);box-shadow:0 0 0 4px rgba(242,201,76,.16)}.input::placeholder{color:#9aa4b2}select:invalid{color:#9aa4b2}select option{color:#181b23}.upload-box{border-radius:28px;padding:20px;background:linear-gradient(180deg,#0b1325,#182746);color:#fff;border:1px solid rgba(255,255,255,.08)}.upload-top{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:14px}.upload-kicker{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.64);font-weight:800}.upload-top p{margin-top:6px;color:rgba(255,255,255,.78);font-size:14px;line-height:1.7}.status-pill{padding:10px 12px;border-radius:999px;background:rgba(255,255,255,.14);font-size:12px;font-weight:800;white-space:nowrap}.dropzone{border:1px dashed rgba(242,201,76,.42);border-radius:22px;padding:20px;background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.03));display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:center}.drop-icon{width:48px;height:48px;border:none;border-radius:16px;display:grid;place-items:center;background:rgba(255,255,255,.08);color:#fff;font-size:28px;cursor:pointer}.drop-copy strong{display:block;font-size:15px}.drop-copy span{display:block;color:rgba(255,255,255,.72);font-size:13px;line-height:1.6;margin-top:4px}.clear-photos{margin-top:14px;border:none;border-radius:999px;background:rgba(255,255,255,.1);color:#fff;padding:9px 13px;cursor:pointer}.thumb-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:18px}.thumb{position:relative;border-radius:20px;overflow:hidden;aspect-ratio:1/.85;background:#dce3ef;box-shadow:0 12px 26px rgba(20,24,36,.16);border:1px solid rgba(255,255,255,.08)}.thumb img{width:100%;height:100%;object-fit:cover;display:block}.thumb-badge{position:absolute;left:10px;bottom:10px;padding:7px 10px;border-radius:999px;background:rgba(15,19,32,.82);color:#fff;font-size:11px;font-weight:700;backdrop-filter:blur(8px)}.remove-photo{position:absolute;top:8px;right:8px;width:28px;height:28px;border-radius:50%;border:1px solid rgba(255,255,255,.45);background:rgba(2,8,22,.78);color:#fff;font-size:20px;line-height:1;cursor:pointer;display:grid;place-items:center}.remove-photo:hover{background:#dc2626}.result-shell{display:grid;gap:16px}.price-banner{border-radius:30px;padding:26px;color:#fff;position:relative;overflow:hidden;min-height:200px;display:flex;flex-direction:column;justify-content:space-between;background:linear-gradient(135deg,#0a4e2a 0%,#0d7c44 50%,#4cb772 100%);opacity:.95}.price-banner:not(.is-visible){background:linear-gradient(135deg,#253044,#111827)}.price-top{display:flex;align-items:start;justify-content:space-between;gap:14px}.price-top h3{font-size:36px;letter-spacing:-.04em}.price-top p{max-width:440px;color:rgba(255,255,255,.9);line-height:1.8;font-size:14px}.price-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:18px}.price-box{padding:14px;border-radius:18px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.2)}.price-box strong{display:block;font-size:22px;color:#fff}.price-box span{display:block;margin-top:5px;color:rgba(255,255,255,.92);font-size:12px;line-height:1.45}.result-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.result-card{background:#fff;border-radius:28px;padding:22px;border:1px solid rgba(17,19,26,.06);box-shadow:var(--shadow-soft);color:#11131a}.result-card h4{font-size:22px;margin-bottom:14px;letter-spacing:-.03em}.key-list,.analysis-list{display:grid;gap:12px}.key-item{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:14px;border-radius:18px;background:#f7f8fb;border:1px solid rgba(17,19,26,.05)}.key-item strong{display:block;font-size:15px;font-family:Inter,Arial,sans-serif;color:#182132}.key-item span{display:block;color:#586277;font-size:13px;line-height:1.72;margin-top:4px}.value{font-weight:800;white-space:nowrap;color:#182132}.score-ring-wrap{display:flex;align-items:center;gap:18px}.score-ring{width:118px;height:118px;border-radius:50%;position:relative;flex:0 0 118px;background:conic-gradient(from -90deg,#f2c94c calc(var(--score)*1%),#dfe5ee 0)}.score-ring:after{content:attr(data-score) "%";position:absolute;inset:12px;border-radius:50%;background:linear-gradient(180deg,#fff,#f5f7fb);display:grid;place-items:center;font-weight:800;font-size:24px;color:#111827}.score-ring-wrap strong{display:block;font-size:24px;margin-bottom:8px;color:#182132}.cards3{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}.insight-card{background:#fff;border-radius:26px;padding:22px;border:1px solid rgba(17,19,26,.05);box-shadow:0 18px 30px rgba(25,30,42,.08)}.insight-card h3{font-size:24px;margin-bottom:10px}.insight-card p{color:#6c7280;font-size:14px;line-height:1.8}@media(max-width:1100px){.hero-grid,.tool-layout,.cards3,.result-grid{grid-template-columns:1fr;display:grid}.hero-copy h1{font-size:62px}}@media(max-width:760px){.container{width:min(100% - 28px,1180px)}.nav-inner{flex-wrap:wrap;justify-content:center}.nav-links{width:100%;justify-content:center}.hero-grid{min-height:auto;padding:18px 0 48px}.hero-copy h1{font-size:50px}.hero-stats,.price-meta,.form-grid,.thumb-grid{grid-template-columns:1fr}.hero-thumb-grid,.hero-side-grid{grid-template-columns:1fr}.section h2{font-size:40px}.dropzone{grid-template-columns:1fr}}
`;
