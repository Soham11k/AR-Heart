/**
 * Complete catalog of 26 anatomical structures of the human heart,
 * enriched with hierarchy, synonyms, related structures, clinical notes,
 * cardiac cycle mechanics, ontology IDs, provenance, and recommended slice presets.
 */
export const HEART_PARTS = [
  // ============================================================================
  // Chambers & Septa (7)
  // ============================================================================
  {
    id: 'right_atrium',
    name: 'Right Atrium',
    latin: 'Atrium dextrum',
    category: 'Chambers & Septa',
    subGroup: 'Atria',
    oxygenation: 'Deoxygenated (Venous)',
    color: 0x3b82f6,
    ontologyId: 'UBERON:0002078',
    sourceProvenance: 'HuBMAP VHM v1.2',
    recommendedSlicePreset: 'four-chamber',
    synonyms: ['ra', 'right auricle', 'pectinate muscles', 'crista terminalis', 'sa node'],
    relatedIds: ['superior_vena_cava', 'inferior_vena_cava', 'coronary_sinus', 'tricuspid_valve', 'interatrial_septum'],
    pathway: 'SVC / IVC / Coronary Sinus → Tricuspid Valve',
    role: 'Receives systemic venous return & houses SA pacemaker node',
    description:
      'Upper right chamber receiving deoxygenated blood from the superior vena cava, inferior vena cava, and coronary sinus. Its anterior auricular appendage is lined by pectinate muscle ridges separated from the smooth sinus venarum by the crista terminalis.',
    clinicalNotes:
      'Houses the sinoatrial (SA) node near the SVC junction and the atrioventricular (AV) node in the triangle of Koch. Enlargement or fibrosis predisposes to atrial flutter and atrial fibrillation.',
    cycleRelation:
      'Fills passively during ventricular systole (v-wave) and contracts during late diastole (P-wave atrial kick, a-wave) to contribute ~15–20% of right ventricular end-diastolic volume.'
  },
  {
    id: 'right_ventricle',
    name: 'Right Ventricle',
    latin: 'Ventriculus dexter',
    category: 'Chambers & Septa',
    subGroup: 'Ventricles',
    oxygenation: 'Deoxygenated (Venous)',
    color: 0x2563eb,
    ontologyId: 'UBERON:0002080',
    sourceProvenance: 'HuBMAP VHM v1.2',
    recommendedSlicePreset: 'short-axis',
    synonyms: ['rv', 'infundibulum', 'conus arteriosus', 'moderator band', 'septomarginal trabecula'],
    relatedIds: ['tricuspid_valve', 'pulmonary_valve', 'interventricular_septum', 'papillary_muscles', 'pulmonary_trunk'],
    pathway: 'Tricuspid Valve → Pulmonary Valve → Pulmonary Trunk',
    role: 'Low-pressure crescentic pump driving blood to the lungs (~25/4 mmHg)',
    description:
      'Crescent-shaped anterior chamber wrapping around the right-anterior aspect of the left ventricle. Its inflow region is lined by coarse trabeculae carneae and the septomarginal trabecula (moderator band), tapering superiorly into the smooth conus arteriosus (infundibulum).',
    clinicalNotes:
      'Because its wall is only 3–5 mm thick (one-third of the LV), the right ventricle is highly compliant to volume preload but sensitive to acute pressure afterload such as massive pulmonary embolism.',
    cycleRelation:
      'Contracts predominantly via longitudinal shortening (TAPSE) and bellows-like inward movement of the free wall against the convex interventricular septum during systole.'
  },
  {
    id: 'left_atrium',
    name: 'Left Atrium',
    latin: 'Atrium sinistrum',
    category: 'Chambers & Septa',
    subGroup: 'Atria',
    oxygenation: 'Oxygenated (Arterial)',
    color: 0xf43f5e,
    ontologyId: 'UBERON:0002079',
    sourceProvenance: 'HuBMAP VHM v1.2',
    recommendedSlicePreset: 'four-chamber',
    synonyms: ['la', 'left atrial appendage', 'laa', 'left auricle', 'oblique sinus'],
    relatedIds: ['left_pulmonary_veins', 'right_pulmonary_veins', 'mitral_valve', 'interatrial_septum'],
    pathway: 'Left & Right Pulmonary Veins → Mitral Valve',
    role: 'Oxygenated posterior reservoir feeding the left ventricle',
    description:
      'Most posteriorly situated cardiac chamber, forming the base of the heart directly anterior to the esophagus and descending thoracic aorta. Receives oxygenated blood from four pulmonary veins and features a trabeculated tubular left atrial appendage.',
    clinicalNotes:
      'The left atrial appendage (LAA) is the most common site of thrombus formation in non-valvular atrial fibrillation. Left atrial dilation can compress the adjacent esophagus or recurrent laryngeal nerve.',
    cycleRelation:
      'Acts as a reservoir during LV systole, a passive conduit in early diastole, and an active booster pump during late diastolic atrial systole.'
  },
  {
    id: 'left_ventricle',
    name: 'Left Ventricle',
    latin: 'Ventriculus sinister',
    category: 'Chambers & Septa',
    subGroup: 'Ventricles',
    oxygenation: 'Oxygenated (Arterial)',
    color: 0xdc2626,
    ontologyId: 'UBERON:0002084',
    sourceProvenance: 'HuBMAP VHM v1.2',
    recommendedSlicePreset: 'short-axis',
    synonyms: ['lv', 'systemic ventricle', 'lvot', 'myocardium', 'trabeculae carneae'],
    relatedIds: ['mitral_valve', 'aortic_valve', 'interventricular_septum', 'cardiac_apex', 'papillary_muscles'],
    pathway: 'Mitral Valve → Aortic Valve → Ascending Aorta',
    role: 'High-pressure conical systemic pump (~120/80 mmHg)',
    description:
      'Thick-walled (9–11 mm) conical muscular chamber forming the obtuse left margin, diaphragmatic surface, and apex. Its endocardial surface displays a dense meshwork of fine trabeculae carneae and two large papillary muscles.',
    clinicalNotes:
      'Sustained pressure overload (aortic stenosis, systemic hypertension) induces concentric left ventricular hypertrophy, whereas volume overload or post-infarct remodeling drives eccentric dilation and systolic heart failure.',
    cycleRelation:
      'During isovolumetric contraction and ejection, helical subepicardial and subendocardial fibers twist the apex counterclockwise relative to the base while thickening radially.'
  },
  {
    id: 'interventricular_septum',
    name: 'Interventricular Septum',
    latin: 'Septum interventriculare',
    category: 'Chambers & Septa',
    subGroup: 'Cardiac Septa',
    oxygenation: 'Structural Septum',
    color: 0xbe123c,
    ontologyId: 'UBERON:0002094',
    sourceProvenance: 'HuBMAP VHM v1.2',
    recommendedSlicePreset: 'four-chamber',
    synonyms: ['ivs', 'ventricular septum', 'membranous septum', 'muscular septum', 'bundle of his'],
    relatedIds: ['left_ventricle', 'right_ventricle', 'left_anterior_descending', 'right_coronary_artery'],
    pathway: 'Divides Right & Left Ventricles (Bundle of His & bundle branches)',
    role: 'Separates systemic & pulmonary ventricles; conducts electrical impulses',
    description:
      'Oblique, curved partition comprising a thick muscular portion and a thin superior membranous portion near the aortic root. Bulges into the right ventricular cavity due to higher left ventricular pressure.',
    clinicalNotes:
      'Ventricular septal defects (VSDs) most frequently involve the perimembranous region. The anterior two-thirds is perfused by septal perforators of the LAD and the posterior third by the PDA.',
    cycleRelation:
      'Depolarizes earliest during QRS onset (left-to-right septal activation, producing the septal Q wave) and stiffens to anchor biventricular contraction.'
  },
  {
    id: 'interatrial_septum',
    name: 'Interatrial Septum',
    latin: 'Septum interatriale',
    category: 'Chambers & Septa',
    subGroup: 'Cardiac Septa',
    oxygenation: 'Structural Septum',
    color: 0x9f1239,
    ontologyId: 'UBERON:0002085',
    sourceProvenance: 'Supplemental Anatomical',
    recommendedSlicePreset: 'four-chamber',
    synonyms: ['ias', 'atrial septum', 'fossa ovalis', 'foramen ovale', 'pfo', 'asd'],
    relatedIds: ['right_atrium', 'left_atrium', 'tricuspid_valve', 'mitral_valve'],
    pathway: 'Divides Right & Left Atria (contains Fossa Ovalis & Limbus)',
    role: 'Seals left and right atrial chambers after fetal circulation closes',
    description:
      'Thin fibromuscular partition obliquely separating the right and left atria. Features the oval depression of the fossa ovalis (remnant of the embryonic septum primum) bordered superiorly by the prominent limbus (septum secundum).',
    clinicalNotes:
      'A probe-patent foramen ovale (PFO) persists in ~25% of adults and is the primary route for transseptal catheterization into the left atrium as well as paradoxical embolism.',
    cycleRelation:
      'Maintains pressure separation between the slightly higher-pressure left atrium (~8–12 mmHg) and lower-pressure right atrium (~2–6 mmHg) throughout the cycle.'
  },
  {
    id: 'cardiac_apex',
    name: 'Cardiac Apex',
    latin: 'Apex cordis',
    category: 'Chambers & Septa',
    subGroup: 'Ventricles',
    oxygenation: 'Oxygenated Myocardium',
    color: 0xb91c1c,
    ontologyId: 'UBERON:0002098',
    sourceProvenance: 'HuBMAP VHM v1.2 (Derived)',
    recommendedSlicePreset: 'four-chamber',
    synonyms: ['apex', 'pmi', 'apical impulse', 'vortex cordis'],
    relatedIds: ['left_ventricle', 'right_ventricle', 'left_anterior_descending'],
    pathway: 'Anteroinferior conical tip formed by the Left Ventricle',
    role: 'Produces the point of maximal impulse (PMI) & helical systolic twist',
    description:
      'Conical inferolateral extremity of the heart directed anteriorly, inferiorly, and to the left at the 5th intercostal space along the midclavicular line. Here superficial myocardial fibers spiral inward to form the vortex cordis.',
    clinicalNotes:
      'Apical akinesis or aneurysm following distal LAD occlusion predisposes to mural left ventricular thrombus; Takotsubo cardiomyopathy classically produces transient apical ballooning.',
    cycleRelation:
      'Rotates counterclockwise (viewed from the apex) during ventricular ejection to wring blood upward toward the aortic outflow tract, then untwists rapidly in early isovolumetric relaxation.'
  },

  // ============================================================================
  // Valves & Apparatus (6)
  // ============================================================================
  {
    id: 'tricuspid_valve',
    name: 'Tricuspid Valve',
    latin: 'Valva atrioventricularis dextra',
    category: 'Valves & Apparatus',
    subGroup: 'Atrioventricular Valves',
    oxygenation: 'Deoxygenated Pathway',
    color: 0xfef08a,
    ontologyId: 'UBERON:0002134',
    sourceProvenance: 'HuBMAP VHM v1.2',
    recommendedSlicePreset: 'four-chamber',
    synonyms: ['tv', 'right av valve', 'anterior leaflet', 'septal leaflet', 'posterior leaflet'],
    relatedIds: ['right_atrium', 'right_ventricle', 'chordae_tendineae', 'papillary_muscles'],
    pathway: 'Right Atrium → Right Ventricle',
    role: 'Three-leaflet AV valve preventing right atrial regurgitation',
    description:
      'Largest cardiac valve (~7–9 cm² orifice area), seated slightly more apically than the mitral valve. Comprises anterior, posterior, and septal leaflets anchored to a dynamic fibrous annulus and tethered by chordae tendineae.',
    clinicalNotes:
      'Functional tricuspid regurgitation commonly results from right ventricular dilation and annular stretching; the septal leaflet forms the anterior border of the triangle of Koch near the AV node.',
    cycleRelation:
      'Opens widely during early diastolic rapid filling and atrial contraction; snaps shut at the onset of right ventricular systole, generating the T1 component of the first heart sound (S1).'
  },
  {
    id: 'mitral_valve',
    name: 'Mitral (Bicuspid) Valve',
    latin: 'Valva atrioventricularis sinistra',
    category: 'Valves & Apparatus',
    subGroup: 'Atrioventricular Valves',
    oxygenation: 'Oxygenated Pathway',
    color: 0xfde047,
    ontologyId: 'UBERON:0002135',
    sourceProvenance: 'HuBMAP VHM v1.2',
    recommendedSlicePreset: 'four-chamber',
    synonyms: ['mv', 'bicuspid valve', 'left av valve', 'anterior mitral leaflet'],
    relatedIds: ['left_atrium', 'left_ventricle', 'chordae_tendineae', 'papillary_muscles', 'aortic_valve'],
    pathway: 'Left Atrium → Left Ventricle',
    role: 'Two-leaflet high-pressure AV valve sealing the left atrium in systole',
    description:
      'Saddle-shaped dual-leaflet valve between the left atrium and left ventricle. Its broad anterior (aortic) leaflet is in fibrous continuity with the aortic valve non-coronary and left cusps, while the crescentic posterior (mural) leaflet has three scallops (P1, P2, P3).',
    clinicalNotes:
      'Myxomatous degeneration of the P2 scallop is the leading cause of primary mitral valve prolapse and regurgitation; rheumatic fever classically causes commissural fusion and "fish-mouth" mitral stenosis.',
    cycleRelation:
      'Coapts forcefully at the start of isovolumetric ventricular contraction to produce the dominant M1 component of S1, withstanding ~120 mmHg systolic pressure.'
  },
  {
    id: 'pulmonary_valve',
    name: 'Pulmonary Semilunar Valve',
    latin: 'Valva trunci pulmonalis',
    category: 'Valves & Apparatus',
    subGroup: 'Semilunar Valves',
    oxygenation: 'Deoxygenated Pathway',
    color: 0x7dd3fc,
    ontologyId: 'UBERON:0002146',
    sourceProvenance: 'HuBMAP VHM v1.2',
    recommendedSlicePreset: 'outflow-tract',
    synonyms: ['pv', 'pulmonic valve', 'semilunar cusps', 'p2 sound'],
    relatedIds: ['right_ventricle', 'pulmonary_trunk', 'aortic_valve'],
    pathway: 'Right Ventricle → Pulmonary Trunk',
    role: 'Three semilunar cusps preventing pulmonary arterial backflow',
    description:
      'Most superior and anterior cardiac valve, situated at the summit of the right ventricular infundibulum (conus arteriosus). Consists of anterior, right, and left semilunar cusps with central fibrous nodules of Arantius.',
    clinicalNotes:
      'Congenital pulmonic stenosis is a hallmark component of Tetralogy of Fallot; in the Ross procedure, the native pulmonary autograft is transplanted into the aortic position.',
    cycleRelation:
      'Pushed open passively when RV systolic pressure exceeds pulmonary arterial pressure (~15–25 mmHg), then closes at end-systole to produce the P2 component of the second heart sound (S2).'
  },
  {
    id: 'aortic_valve',
    name: 'Aortic Semilunar Valve',
    latin: 'Valva aortae',
    category: 'Valves & Apparatus',
    subGroup: 'Semilunar Valves',
    oxygenation: 'Oxygenated Pathway',
    color: 0xfbbf24,
    ontologyId: 'UBERON:0002137',
    sourceProvenance: 'HuBMAP VHM v1.2',
    recommendedSlicePreset: 'outflow-tract',
    synonyms: ['av', 'aortic cusps', 'sinuses of valsalva', 'a2 sound'],
    relatedIds: ['left_ventricle', 'aorta_arch', 'right_coronary_artery', 'left_circumflex_artery', 'mitral_valve'],
    pathway: 'Left Ventricle → Ascending Aorta & Sinuses of Valsalva',
    role: 'Three semilunar cusps guarding the high-pressure systemic outflow tract',
    description:
      'Central cardiac centerpiece wedged between the mitral, tricuspid, and pulmonary valves. Features right coronary, left coronary, and posterior non-coronary semilunar cusps backed by the aortic sinuses of Valsalva.',
    clinicalNotes:
      'Calcific aortic stenosis in older adults or congenital bicuspid aortic valve (~1–2% of population) obstructs LV outflow, producing a crescendo-decrescendo systolic ejection murmur radiating to the carotids.',
    cycleRelation:
      'Opens when LV pressure surpasses aortic diastolic pressure (~80 mmHg) and snaps shut at the incisura (dicrotic notch) to generate the crisp A2 component of S2 and drive diastolic coronary perfusion.'
  },
  {
    id: 'chordae_tendineae',
    name: 'Chordae Tendineae',
    latin: 'Chordae tendineae cordis',
    category: 'Valves & Apparatus',
    subGroup: 'Subvalvular Apparatus',
    oxygenation: 'Fibrous Subvalvular Apparatus',
    color: 0xfef9c3,
    ontologyId: 'UBERON:0002131',
    sourceProvenance: 'Supplemental Anatomical',
    recommendedSlicePreset: 'four-chamber',
    synonyms: ['heartstrings', 'tendinous cords', 'subvalvular cords'],
    relatedIds: ['papillary_muscles', 'mitral_valve', 'tricuspid_valve', 'left_ventricle', 'right_ventricle'],
    pathway: 'Papillary Muscle Apices → Tricuspid & Mitral Leaflet Margins',
    role: 'Inelastic collagenous cords preventing AV leaflet prolapse in systole',
    description:
      'Branching fan-like tendons composed of dense elastin-wrapped collagen fibers linking the apices of the ventricular papillary muscles to the free margins (primary chordae) and ventricular rough zones (secondary chordae) of the mitral and tricuspid leaflets.',
    clinicalNotes:
      'Spontaneous or ischemic chordal rupture causes acute flail leaflet and severe regurgitant pulmonary edema.',
    cycleRelation:
      'Slack slightly during diastolic valve opening and pull taut during ventricular systole to hold the coapted AV valve leaflets in the annular plane.'
  },
  {
    id: 'papillary_muscles',
    name: 'Papillary Muscles',
    latin: 'Musculi papillares',
    category: 'Valves & Apparatus',
    subGroup: 'Subvalvular Apparatus',
    oxygenation: 'Ventricular Myocardium',
    color: 0xfb7185,
    ontologyId: 'FMA:7261–7267',
    sourceProvenance: 'HuBMAP VHM v1.2',
    recommendedSlicePreset: 'four-chamber',
    synonyms: ['anterolateral papillary', 'posteromedial papillary', 'septal papillary'],
    relatedIds: ['chordae_tendineae', 'mitral_valve', 'tricuspid_valve', 'left_ventricle', 'right_ventricle'],
    pathway: 'Ventricular Endocardium → Chordae Tendineae',
    role: 'Contract isometrically with ventricles to maintain chordal tension',
    description:
      'Five conical muscular pillars projecting into the ventricular lumina: anterior, posterior, and septal papillary muscles in the right ventricle, and stout anterolateral and posteromedial papillary muscles in the left ventricle.',
    clinicalNotes:
      'Whereas the anterolateral LV papillary muscle has dual blood supply (LAD + LCx), the posteromedial papillary muscle receives a single blood supply from the PDA, making it vulnerable to post-MI rupture.',
    cycleRelation:
      'Depolarize and shorten simultaneously with the ventricular wall during systole so the distance between the ventricular apex and AV valve leaflets does not slacken.'
  },

  // ============================================================================
  // Great Vessels (9)
  // ============================================================================
  {
    id: 'aorta_arch',
    name: 'Ascending Aorta & Arch',
    latin: 'Aorta ascendens et Arcus aortae',
    category: 'Great Vessels',
    subGroup: 'Systemic Arteries',
    oxygenation: 'Oxygenated (Arterial)',
    color: 0xef4444,
    ontologyId: 'UBERON:0001508',
    sourceProvenance: 'HuBMAP VHM v1.2',
    recommendedSlicePreset: 'outflow-tract',
    synonyms: ['aortic root', 'brachiocephalic trunk', 'common carotid', 'subclavian', 'windkessel'],
    relatedIds: ['aortic_valve', 'descending_aorta', 'right_coronary_artery', 'left_circumflex_artery', 'pulmonary_trunk'],
    pathway: 'Aortic Valve → Brachiocephalic / Left Carotid / Left Subclavian / Descending Aorta',
    role: 'Primary systemic arterial conduit with Windkessel elastic recoil',
    description:
      'Thick elastin-rich great artery arising from the left ventricular outflow tract, ascending anterior to the right pulmonary artery and arching posteriorly over the left pulmonary hilum while giving off the brachiocephalic, left common carotid, and left subclavian arteries.',
    clinicalNotes:
      'The ascending aorta and aortic isthmus (just distal to the left subclavian origin at the ligamentum arteriosum) are critical sites for Stanford Type A/B dissections and traumatic aortic rupture.',
    cycleRelation:
      'Distends during systolic ejection to store ~50% of stroke volume as elastic potential energy (Windkessel effect), then recoils in diastole to sustain continuous systemic and coronary flow.'
  },
  {
    id: 'descending_aorta',
    name: 'Descending Thoracic Aorta',
    latin: 'Aorta thoracica descendens',
    category: 'Great Vessels',
    subGroup: 'Systemic Arteries',
    oxygenation: 'Oxygenated (Arterial)',
    color: 0xb91c1c,
    ontologyId: 'UBERON:0001515',
    sourceProvenance: 'HuBMAP VHM v1.2',
    recommendedSlicePreset: 'sagittal-valves',
    synonyms: ['thoracic aorta', 'posterior mediastinal aorta'],
    relatedIds: ['aorta_arch', 'left_atrium', 'left_pulmonary_artery'],
    pathway: 'Aortic Arch (T4) → Posterior Mediastinum → Diaphragmatic Hiatus (T12)',
    role: 'Delivers oxygenated arterial blood to the thorax, abdomen, and lower body',
    description:
      'Continuation of the aortic arch descending vertically through the posterior mediastinum immediately posterior to the left atrium and esophagus, giving off posterior intercostal, bronchial, and esophageal branches.',
    clinicalNotes:
      'Because it courses directly behind the left atrium, transesophageal echocardiography (TEE) provides high-resolution imaging of the descending thoracic aorta for dissection or atheroma.',
    cycleRelation:
      'Propagates the systolic arterial pulse wave distally at ~5–8 m/s while maintaining forward laminar flow during diastolic elastic recoil.'
  },
  {
    id: 'pulmonary_trunk',
    name: 'Pulmonary Trunk',
    latin: 'Truncus pulmonalis',
    category: 'Great Vessels',
    subGroup: 'Pulmonary Vessels',
    oxygenation: 'Deoxygenated (Venous)',
    color: 0x38bdf8,
    ontologyId: 'UBERON:0002333',
    sourceProvenance: 'HuBMAP VHM v1.2',
    recommendedSlicePreset: 'outflow-tract',
    synonyms: ['main pulmonary artery', 'mpa', 'pulmonary bifurcation'],
    relatedIds: ['pulmonary_valve', 'left_pulmonary_artery', 'right_pulmonary_artery', 'aorta_arch'],
    pathway: 'Pulmonary Valve → Left & Right Pulmonary Arteries',
    role: 'Main arterial trunk carrying deoxygenated blood from RV to lungs',
    description:
      'Wide (~3 cm diameter), thin-walled arterial trunk emerging from the right ventricular infundibulum and spiraling superiorly and posteriorly to the left of the ascending aorta before bifurcating beneath the aortic arch.',
    clinicalNotes:
      'A saddle pulmonary embolus lodges right at the bifurcation of the pulmonary trunk into the left and right pulmonary arteries, causing acute right ventricular strain.',
    cycleRelation:
      'Expands during low-pressure right ventricular systolic ejection (~25 mmHg peak) and channels the entire systemic venous cardiac output into the pulmonary arterial tree.'
  },
  {
    id: 'left_pulmonary_artery',
    name: 'Left Pulmonary Artery',
    latin: 'Arteria pulmonalis sinistra',
    category: 'Great Vessels',
    subGroup: 'Pulmonary Vessels',
    oxygenation: 'Deoxygenated (Venous)',
    color: 0x0ea5e9,
    ontologyId: 'UBERON:0002012',
    sourceProvenance: 'HuBMAP VHM v1.2',
    recommendedSlicePreset: 'outflow-tract',
    synonyms: ['lpa', 'ligamentum arteriosum', 'ductus arteriosus'],
    relatedIds: ['pulmonary_trunk', 'right_pulmonary_artery', 'descending_aorta', 'aorta_arch'],
    pathway: 'Pulmonary Trunk → Left Lung Hilum',
    role: 'Delivers deoxygenated blood to the left lung for alveolar gas exchange',
    description:
      'Shorter left terminal branch of the pulmonary trunk coursing laterally anterior to the descending thoracic aorta and left main bronchus to enter the left pulmonary hilum. Connected superiorly to the aortic arch concavity by the ligamentum arteriosum.',
    clinicalNotes:
      'Persistence of the fetal ductus arteriosus (PDA) between the proximal left pulmonary artery and aortic arch causes a continuous "machinery" left-to-right shunt murmur.',
    cycleRelation:
      'Conducts pulsatile deoxygenated right ventricular stroke volume into the low-resistance left pulmonary capillary bed.'
  },
  {
    id: 'right_pulmonary_artery',
    name: 'Right Pulmonary Artery',
    latin: 'Arteria pulmonalis dextra',
    category: 'Great Vessels',
    subGroup: 'Pulmonary Vessels',
    oxygenation: 'Deoxygenated (Venous)',
    color: 0x0284c7,
    ontologyId: 'UBERON:0002012',
    sourceProvenance: 'HuBMAP VHM v1.2',
    recommendedSlicePreset: 'outflow-tract',
    synonyms: ['rpa'],
    relatedIds: ['pulmonary_trunk', 'left_pulmonary_artery', 'aorta_arch', 'superior_vena_cava'],
    pathway: 'Pulmonary Trunk → Sub-aortic Tunnel → Right Lung Hilum',
    role: 'Delivers deoxygenated blood horizontally beneath the aortic arch to the right lung',
    description:
      'Longer and slightly wider right branch of the pulmonary trunk passing horizontally to the right directly beneath the aortic arch, posterior to the ascending aorta and superior vena cava, and anterior to the right main bronchus.',
    clinicalNotes:
      'Its retro-aortic course forms the roof of the transverse pericardial sinus used by cardiac surgeons to pass vascular clamps around the ascending aorta and pulmonary trunk.',
    cycleRelation:
      'Receives ~55% of right ventricular systolic output and dampens pulsatility before blood reaches the right alveolar-capillary membrane.'
  },
  {
    id: 'superior_vena_cava',
    name: 'Superior Vena Cava (SVC)',
    latin: 'Vena cava superior',
    category: 'Great Vessels',
    subGroup: 'Systemic Veins',
    oxygenation: 'Deoxygenated (Venous)',
    color: 0x1d4ed8,
    ontologyId: 'FMA:4720',
    sourceProvenance: 'HuBMAP VHM v1.2',
    recommendedSlicePreset: 'sagittal-valves',
    synonyms: ['svc', 'precava', 'brachiocephalic confluence'],
    relatedIds: ['right_atrium', 'inferior_vena_cava', 'right_pulmonary_artery', 'aorta_arch'],
    pathway: 'Left & Right Brachiocephalic Veins → Superior Right Atrium',
    role: 'Drains deoxygenated venous blood from the head, neck, upper limbs, and azygos system',
    description:
      'Large valveless venous trunk (~2 cm diameter) formed by the confluence of the left and right brachiocephalic veins behind the right first costal cartilage, descending vertically to empty into the superior sinus venarum of the right atrium.',
    clinicalNotes:
      'Internal jugular and subclavian central venous catheters terminate at the cavoatrial junction; external compression by mediastinal masses causes SVC syndrome.',
    cycleRelation:
      'Exhibits biphasic forward venous flow peaking during ventricular systole (x-descent) and early diastolic tricuspid opening (y-descent).'
  },
  {
    id: 'inferior_vena_cava',
    name: 'Inferior Vena Cava (IVC)',
    latin: 'Vena cava inferior',
    category: 'Great Vessels',
    subGroup: 'Systemic Veins',
    oxygenation: 'Deoxygenated (Venous)',
    color: 0x1e40af,
    ontologyId: 'FMA:10951',
    sourceProvenance: 'HuBMAP VHM v1.2',
    recommendedSlicePreset: 'sagittal-valves',
    synonyms: ['ivc', 'postcava', 'eustachian valve'],
    relatedIds: ['right_atrium', 'superior_vena_cava', 'coronary_sinus'],
    pathway: 'Abdominal & Lower-Body Veins → Diaphragm (T8) → Inferior Right Atrium',
    role: 'Largest systemic vein returning lower-body and hepatic blood to the right atrium',
    description:
      'Wide venous trunk ascending through the central tendon of the diaphragm at the T8 caval opening and entering the posteroinferior aspect of the right atrium instantly, guarded anteriorly by the rudimentary Eustachian valve.',
    clinicalNotes:
      'Subcostal echocardiographic measurement of IVC diameter and inspiratory collapsibility is the clinical gold standard for non-invasively estimating right atrial pressure (CVP).',
    cycleRelation:
      'Delivers ~65% of total venous return into the right atrium, modulated by both cardiac atrial pressure waves and intrathoracic respiratory pressure.'
  },
  {
    id: 'left_pulmonary_veins',
    name: 'Left Pulmonary Veins',
    latin: 'Venae pulmonales sinistrae',
    category: 'Great Vessels',
    subGroup: 'Pulmonary Vessels',
    oxygenation: 'Oxygenated (Arterial)',
    color: 0xfb7185,
    ontologyId: 'FMA:49913',
    sourceProvenance: 'HuBMAP VHM v1.2',
    recommendedSlicePreset: 'four-chamber',
    synonyms: ['lpv', 'left superior pulmonary vein', 'left inferior pulmonary vein'],
    relatedIds: ['left_atrium', 'right_pulmonary_veins', 'left_pulmonary_artery'],
    pathway: 'Left Lung Alveolar Capillaries → Posterolateral Left Atrium',
    role: 'Return freshly oxygenated arterial blood from the left lung into the left atrium',
    description:
      'Superior and inferior left pulmonary veins emerging from the left lung hilum anterior to the descending thoracic aorta and entering the left posterosuperior wall of the left atrium without valves.',
    clinicalNotes:
      'Myocardial sleeves extending 1–3 cm into the pulmonary vein ostia are the primary trigger sites targeted by circumferential pulmonary vein isolation (PVI) ablation for atrial fibrillation.',
    cycleRelation:
      'Display forward systolic (S-wave) and early diastolic (D-wave) inflow into the left atrium, with a brief reversal wave (A-wave) during atrial contraction.'
  },
  {
    id: 'right_pulmonary_veins',
    name: 'Right Pulmonary Veins',
    latin: 'Venae pulmonales dextrae',
    category: 'Great Vessels',
    subGroup: 'Pulmonary Vessels',
    oxygenation: 'Oxygenated (Arterial)',
    color: 0xf43f5e,
    ontologyId: 'FMA:49914',
    sourceProvenance: 'HuBMAP VHM v1.2',
    recommendedSlicePreset: 'four-chamber',
    synonyms: ['rpv', 'right superior pulmonary vein', 'right inferior pulmonary vein'],
    relatedIds: ['left_atrium', 'left_pulmonary_veins', 'superior_vena_cava', 'right_atrium'],
    pathway: 'Right Lung Alveolar Capillaries → Posteromedial Left Atrium',
    role: 'Return freshly oxygenated arterial blood from the right lung into the left atrium',
    description:
      'Superior and inferior right pulmonary veins passing horizontally behind the superior vena cava and right atrium to empty directly into the right posterosuperior corner of the left atrium.',
    clinicalNotes:
      'Partial anomalous pulmonary venous return (PAPVR) most frequently involves the right superior pulmonary vein draining abnormally into the superior vena cava alongside a sinus venosus ASD.',
    cycleRelation:
      'Work in concert with the left pulmonary veins to replenish the left atrial reservoir continuously across systole and early diastole.'
  },

  // ============================================================================
  // Coronary System (4)
  // ============================================================================
  {
    id: 'coronary_sinus',
    name: 'Coronary Sinus & Cardiac Veins',
    latin: 'Sinus coronarius',
    category: 'Coronary System',
    subGroup: 'Cardiac Veins',
    oxygenation: 'Deoxygenated Myocardial Venous',
    color: 0x6366f1,
    ontologyId: 'UBERON:0005438',
    sourceProvenance: 'HuBMAP VHM v1.2',
    recommendedSlicePreset: 'sagittal-valves',
    synonyms: ['cs', 'great cardiac vein', 'middle cardiac vein', 'small cardiac vein', 'thebesian valve'],
    relatedIds: ['right_atrium', 'left_atrium', 'left_ventricle', 'left_circumflex_artery'],
    pathway: 'Great / Middle / Small Cardiac Veins → Posterior AV Sulcus → Right Atrium',
    role: 'Collects ~75% of deoxygenated myocardial venous drainage into the right atrium',
    description:
      'Wide venous conduit (~2–3 cm long) running in the posterior atrioventricular groove between the left atrium and left ventricle, receiving the great, middle, small, and posterior left ventricular cardiac veins before opening into the right atrium near the Thebesian valve.',
    clinicalNotes:
      'Serves as the anatomical conduit for left ventricular epicardial lead placement in cardiac resynchronization therapy (CRT / biventricular pacing) and retrograde cardioplegia delivery.',
    cycleRelation:
      'Unlike coronary arterial inflow (which peaks in diastole), coronary sinus venous outflow surges during ventricular systole as contracting myocardium squeezes intramyocardial veins.'
  },
  {
    id: 'right_coronary_artery',
    name: 'Right Coronary Artery (RCA)',
    latin: 'Arteria coronaria dextra',
    category: 'Coronary System',
    subGroup: 'Coronary Arteries',
    oxygenation: 'Oxygenated Coronary Arterial',
    color: 0xf97316,
    ontologyId: 'UBERON:0001628',
    sourceProvenance: 'HuBMAP VHM v1.2',
    recommendedSlicePreset: 'short-axis',
    synonyms: ['rca', 'right marginal artery', 'acute marginal', 'pda', 'posterior descending artery'],
    relatedIds: ['aorta_arch', 'aortic_valve', 'right_ventricle', 'right_atrium', 'interventricular_septum'],
    pathway: 'Right Aortic Sinus → Right AV Sulcus → Acute Marginal & Posterior Descending (PDA)',
    role: 'Perfuses right atrium, right ventricle, SA/AV nodes, and inferior ventricular wall',
    description:
      'Originates from the right anterior aortic sinus of Valsalva, courses down the right atrioventricular sulcus embedded in epicardial fat, gives off the acute marginal branch along the RV border, and in ~85% of hearts (right-dominant) furnishes the posterior descending artery (PDA).',
    clinicalNotes:
      'Proximal RCA occlusion causes inferior wall ST-elevation myocardial infarction (leads II, III, aVF), often complicated by RV infarction and vagally/ischemically mediated sinus bradycardia or AV block.',
    cycleRelation:
      'Because right ventricular intramural systolic pressure (~25 mmHg) is much lower than aortic systolic pressure (~120 mmHg), the RCA maintains forward perfusion during both systole and diastole.'
  },
  {
    id: 'left_anterior_descending',
    name: 'Left Anterior Descending (LAD)',
    latin: 'Ramus interventricularis anterior',
    category: 'Coronary System',
    subGroup: 'Coronary Arteries',
    oxygenation: 'Oxygenated Coronary Arterial',
    color: 0xf59e0b,
    ontologyId: 'UBERON:0001626',
    sourceProvenance: 'HuBMAP VHM v1.2',
    recommendedSlicePreset: 'short-axis',
    synonyms: ['lad', 'anterior interventricular artery', 'diagonal branch', 'septal perforators', 'widowmaker'],
    relatedIds: ['left_ventricle', 'interventricular_septum', 'cardiac_apex', 'left_circumflex_artery', 'right_ventricle'],
    pathway: 'Left Main Coronary → Anterior Interventricular Sulcus → Diagonal & Septal Branches → Apex',
    role: 'Supplies ~50% of LV myocardial mass: anterior wall, apex, and anterior 2/3 of septum',
    description:
      'Direct continuation of the left main coronary artery descending along the anterior interventricular groove toward the cardiac apex. Gives off diagonal branches across the anterolateral LV wall and deep septal perforators into the interventricular septum and Bundle of His.',
    clinicalNotes:
      'Clinically termed the "widowmaker": proximal LAD thrombosis causes extensive anteroseptal STEMI (leads V1–V4), severe LV systolic dysfunction, and bundle branch blocks.',
    cycleRelation:
      'High intramyocardial tissue pressure during left ventricular systole compresses subendocardial vessels, so ~80% of LAD nutrient blood flow occurs during ventricular diastole.'
  },
  {
    id: 'left_circumflex_artery',
    name: 'Left Circumflex & Left Main (LCx)',
    latin: 'Arteria coronaria sinistra et Ramus circumflexus',
    category: 'Coronary System',
    subGroup: 'Coronary Arteries',
    oxygenation: 'Oxygenated Coronary Arterial',
    color: 0xfbbf24,
    ontologyId: 'UBERON:0001627',
    sourceProvenance: 'HuBMAP VHM v1.2',
    recommendedSlicePreset: 'short-axis',
    synonyms: ['lcx', 'lmca', 'left main coronary', 'obtuse marginal', 'om branch'],
    relatedIds: ['aorta_arch', 'aortic_valve', 'left_anterior_descending', 'left_ventricle', 'left_atrium'],
    pathway: 'Left Aortic Sinus → Left Main → Left AV Sulcus → Obtuse Marginal Branches',
    role: 'Perfuses the left atrium and lateral/posterolateral left ventricular wall',
    description:
      'Arises from the left aortic sinus via the short left main stem before curving posteriorly within the left atrioventricular groove beneath the left atrial appendage. Gives off obtuse marginal (OM) branches over the lateral wall of the left ventricle.',
    clinicalNotes:
      'LCx occlusion produces lateral STEMI (leads I, aVL, V5–V6) or true posterior MI (tall R waves in V1–V2) and can compromise the anterolateral papillary muscle.',
    cycleRelation:
      'Like the LAD, left circumflex subendocardial perfusion is predominantly diastolic, driven by aortic root elastic recoil after aortic valve closure (A2).'
  }
];

export const HEART_PARTS_BY_ID = Object.fromEntries(HEART_PARTS.map((p) => [p.id, p]));
