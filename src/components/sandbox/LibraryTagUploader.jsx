import firebase from "../../app/config/firebaseConfig";
import { Button } from "@material-ui/core";

const tags = [
  "accuracy",
  "alkali metals",
  "alkaline earth metals",
  "area",
  "atomic radius",
  "Aufbau's principle",
  "balancing chemical equations",
  "balancing redox equations",
  "Beer-Lambert Law",
  "Boyle's Law",
  "chalcogens",
  "charge conservation",
  "Charles' law",
  "classification of matter",
  "covalent bonding",
  "density",
  "dilutions",
  "dimensional analysis",
  "electrolytes",
  "electromagnetic waves",
  "energgy of light",
  "enthalpy",
  "entropy",
  "frequency",
  "Gay-Lussac's law",
  "Gibbs free energy",
  "half-life",
  "halogens",
  "heat",
  "heating curves",
  "Heisenberg uncertainty principle",
  "Henderson-Hasselbalch",
  "Hess's law",
  "history of atomic theory",
  "Hund's rule",
  "ideal gas law",
  "imperial units",
  "internal energy",
  "ionic bonding",
  "isotopes",
  "kinetic molecular theory",
  "lanthanides and actinides",
  "mass conservation",
  "measurements",
  "metallic bonding",
  "miscibility",
  "molality",
  "molarity",
  "noble gases",
  "nomenclature of acids",
  "nomenclature of covalent compounds",
  "nomenclature of ionic compounds",
  "nuclear decay",
  "orbital filling diagrams",
  "oxidation states",
  "Pauli exclusion principle",
  "percent yield",
  "periodic table",
  "eriodic trends",
  "pH",
  "phase diagrams",
  "phases of matter",
  "pnictogens",
  "pOH",
  "polyatomic ions",
  "precision",
  "properties of electrons",
  "properties of elements",
  "properties of gases",
  "properties of ionic compounds",
  "properties of liquids",
  "properties of neutrons",
  "properties of protons",
  "properties of solids",
  "rate laws",
  "scientific notation",
  "significant figures",
  "solubility",
  "solutions",
  "spectator ions",
  "temperature conversions",
  "titrations",
  "transition metals",
  "types of reactions",
  "unit cells",
  "volume",
];

async function uploadTagsToLibrary() {
  const ref = firebase
    .firestore()
    .collection("koral")
    .doc("dbeMOfF6RjH6PlZFkRiM");
  await ref.update({ tags: firebase.firestore.FieldValue.arrayUnion(...tags) });
}

export default function LibraryTagUploader() {
  return (
    <Button onClick={() => uploadTagsToLibrary()}>
      Upload Tags to Library
    </Button>
  );
}
