# 3D Anatomical Model License & Provenance

## Primary Reference Assets (CC BY 4.0)

Heart AR bundles adapted 3D reference organ meshes from the **Human Reference Atlas (HRA) / Human BioMolecular Atlas Program (HuBMAP) CCF 3D Reference Object Library**, derived from the **Visible Human Male** dataset provided by the **U.S. National Library of Medicine (NLM)**.

- **Creator:** Kristen Browne (National Library of Medicine / HuBMAP)
- **Provider:** Human Reference Atlas (HRA) / HuBMAP Consortium
- **License:** [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/)
- **Source Repository:** <https://github.com/hubmapconsortium/ccf-3d-reference-object-library>
- **Reference Portal:** <https://hubmapconsortium.github.io/ccf/pages/ccf-3d-reference-library.html>
- **DOI Reference:** <https://doi.org/10.48539/hbm564.wkng.249>

### Source Files & SHA-256 Checksums

| Source File | Repository Path | Byte Size | SHA-256 Checksum |
| :--- | :--- | ---: | :--- |
| `VH_M_Heart.glb` | `VH_Male/v1.2/VH_M_Heart.glb` | 4,071,500 | `b1237e7e765178e9357fd2ea7ccf19d55d0bf9ca55e187886635febe28244c70` |
| `VH_M_Blood_Vasculature_Heart.glb` | `VH_Male/v1.2/VH_M_Blood_Vasculature_Heart.glb` | 2,833,072 | `51c8392b83cc96235f848d311f75b115b56c93df5e947658ec16a8c1e5d1c891` |

---

## Ontology & Anatomical Structure Mapping

The following structures in Heart AR's 26-part catalog map directly to expert-annotated meshes from the HuBMAP Visible Human Male reference heart and heart vasculature:

| Heart AR Part ID | HuBMAP Source Node(s) | Ontology ID | Source Provenance |
| :--- | :--- | :--- | :--- |
| `right_atrium` | `VH_M_right_cardiac_atrium` | `UBERON:0002078` | HuBMAP VHM v1.2 |
| `right_ventricle` | `VH_M_heart_right_ventricle` | `UBERON:0002080` | HuBMAP VHM v1.2 |
| `left_atrium` | `VH_M_left_cardiac_atrium` | `UBERON:0002079` | HuBMAP VHM v1.2 |
| `left_ventricle` | `VH_M_heart_left_ventricle` | `UBERON:0002084` | HuBMAP VHM v1.2 |
| `interventricular_septum` | `VH_M_interventricular_septum` | `UBERON:0002094` | HuBMAP VHM v1.2 |
| `tricuspid_valve` | `VH_M_tricuspid_valve` | `UBERON:0002134` | HuBMAP VHM v1.2 |
| `mitral_valve` | `VH_M_mitral_valve` | `UBERON:0002135` | HuBMAP VHM v1.2 |
| `pulmonary_valve` | `VH_M_pulmonary_valve` | `UBERON:0002146` | HuBMAP VHM v1.2 |
| `aortic_valve` | `VH_M_aortic_valve` | `UBERON:0002137` | HuBMAP VHM v1.2 |
| `papillary_muscles` | `VH_M_papillary_muscle_of_heart_anterior`, `_anterolateral`, `_medial`, `_posterior`, `_posteromedial` | `FMA:7261`, `FMA:7262`, `FMA:7264`, `FMA:7265`, `FMA:7267` | HuBMAP VHM v1.2 |
| `aorta_arch` | `VH_M_ascending_aorta`, `VH_M_aortic_arch`, `VH_M_brachiocephalic_artery_a`, `VH_M_left_common_carotid_artery_a`, `VH_M_left_subclavian_artery_a` | `UBERON:0001496`, `UBERON:0001508`, `UBERON:0001529` | HuBMAP VHM v1.2 |
| `descending_aorta` | `VH_M_descending_aorta_a` | `UBERON:0001515` | HuBMAP VHM v1.2 |
| `pulmonary_trunk` | `VH_M_pulmonary_trunk` | `UBERON:0002333` | HuBMAP VHM v1.2 |
| `left_pulmonary_artery` | `VH_M_pulmonary_artery_L` | `UBERON:0002012` | HuBMAP VHM v1.2 |
| `right_pulmonary_artery` | `VH_M_pulmonary_artery_R` | `UBERON:0002012` | HuBMAP VHM v1.2 |
| `superior_vena_cava` | `VH_M_superior_vena_cava`, `VH_M_brachiocephalic_vein_L`, `VH_M_brachiocephalic_vein_R` | `FMA:4720`, `FMA:4751`, `FMA:4761` | HuBMAP VHM v1.2 |
| `inferior_vena_cava` | `VH_M_inferior_vena_cava_a` | `FMA:10951` | HuBMAP VHM v1.2 |
| `left_pulmonary_veins` | `VH_M_pulmonary_vein_L_sup`, `VH_M_pulmonary_vein_L_inf` | `FMA:49913`, `FMA:49916` | HuBMAP VHM v1.2 |
| `right_pulmonary_veins` | `VH_M_pulmonary_vein_R_sup`, `VH_M_pulmonary_vein_R_inf` | `FMA:49911`, `FMA:49914` | HuBMAP VHM v1.2 |
| `coronary_sinus` | `VH_M_coronary_sinus`, `VH_M_great_cardiac_vein`, `VH_M_middle_cardiac_vein`, `VH_M_small_cardiac_vein`, `VH_M_anterior_cardiac_vein`, `VH_M_posterior_vein_of_left_ventricle`, `VH_M_oblique_vein_of_left_atrium` | `UBERON:0005438`, `UBERON:0006635`, `UBERON:0009687` | HuBMAP VHM v1.2 |
| `right_coronary_artery` | `VH_M_right_coronary_artery`, `VH_M_right_marginal_artery`, `VH_M_right_posterior_descending_artery` | `UBERON:0001628` | HuBMAP VHM v1.2 |
| `left_anterior_descending` | `VH_M_left_anterior_descending_artery`, `VH_M_diagonal_branch_of_anterior_descending_branch_of_left_coronary_artery` | `UBERON:0001626` | HuBMAP VHM v1.2 |
| `left_circumflex_artery` | `VH_M_left_coronary_artery`, `VH_M_left_marginal_branch`, `VH_M_diagonal_branch_of_left_anterior_descending_artery` | `UBERON:0001627` | HuBMAP VHM v1.2 |

---

## Modifications & Supplemental Anatomical Structures

In accordance with CC BY 4.0 Section 3(a)(1)(B), the following modifications were performed via `scripts/build-assets.mjs`:

1. **Spatial Normalization & Mediastinal Windowing:** Source meshes from `VH_M_Heart.glb` and `VH_M_Blood_Vasculature_Heart.glb` were unified into a centered mediastinal coordinate frame, trimming extra-pericardial abdominal/cervical vessel extensions (`VH_M_descending_aorta_b`, `VH_M_inferior_vena_cava_b`, `VH_M_left_common_carotid_artery_b`, `VH_M_left_subclavian_artery_b`, `VH_M_brachiocephalic_artery_b`).
2. **Surface Parameterization & Endocardial Attribute:** Generated seamless anatomical UV coordinates (`TEXCOORD_0`) and per-vertex endocardial cavity weights (`_ENDOCARDIUM`) for tissue shading.
3. **Supplemental Structures (Explicitly Tagged as `supplemental-anatomical`):**
   - `cardiac_apex` (`UBERON:0002098`): Molded from the anteroinferior apical region of `VH_M_heart_left_ventricle` with a closed planar cap for independent selection and cross-sectional capping.
   - `interatrial_septum` (`UBERON:0002085`): Anatomically contoured septal partition and fossa ovalis rim positioned along the medial interface between `VH_M_right_cardiac_atrium` and `VH_M_left_cardiac_atrium`.
   - `chordae_tendineae` (`UBERON:0002131`): Fibrous tendinous cords anchored between the apices of the five HuBMAP papillary muscles and the free margins of `VH_M_tricuspid_valve` and `VH_M_mitral_valve`.
   - **Epicardial Adipose Pads & Internal Trabeculae Carneae:** Sub-meshes (`tissueKind: 'fat'` and `tissueKind: 'trabecula'`) conforming to the HuBMAP coronary/interventricular sulci and ventricular lumen walls.
4. **Multi-Tier Compression (`heart-high.glb`, `heart-medium.glb`, `heart-low.glb`):** Meshopt-compressed and simplified variants generated for adaptive desktop, tablet, and mobile rendering.

*Disclaimer: This model is intended for educational visualization and anatomical exploration, not for clinical diagnosis or surgical navigation.*
