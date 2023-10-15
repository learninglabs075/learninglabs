//============================= main function =============================//

export function generateSMILES(atoms, bonds) {
  console.log("removing hydrogens...");
  const atoms_H_removed = removeHydrogens(atoms);
  const bonds_H_removed = removeBondsToHydrogen(atoms, bonds);

  console.log("calculating weight index for each atom...");
  // extend atoms table to include weight and number of attachedAtoms
  const atoms0 = extendAtoms(atoms_H_removed, bonds_H_removed);
  const bonds0 = [...bonds_H_removed];
  logAtoms(atoms0);
  logBonds(bonds0);

  // identify terminal atoms
  console.log("searching for terminal atoms...");
  const terminalAtoms = getTerminalAtoms(atoms0);
  logTerminalAtoms(terminalAtoms);

  // identify branch points
  console.log("searching for branch points...");
  const branchPoints = getBranchPoints(atoms0);
  logBranchPoints(branchPoints);

  const chainType = classifyChainType(terminalAtoms, branchPoints);
  logChainType(chainType);

  if (chainType === "unbranched linear") {
    const startAtom = terminalAtoms[0];
    const chain = getUnbLinearChain(atoms0, startAtom, bonds0);
    const priorityChain = pickChainDirection(chain);
    const arrayedSMILES = generateArrayedSMILES(priorityChain, bonds0);
    const SMILES = arrayedSMILES.join("");
    console.log(SMILES);
  }

  if (chainType === "unbranched cyclic") {
    const { isAromatic, piElectrons } = checkAromaticity(atoms0, bonds0);
    const numAtoms = atoms0.length;
    const sigmaElectrons = 2 * bonds0.length;
    const bondingElectrons = piElectrons + sigmaElectrons;
    const avgBondOrder = ((0.5 * bondingElectrons) / numAtoms).toFixed(2);

    const atoms1 = copyArray(atoms0);
    const bonds1 = copyArray(bonds0);

    isAromatic && atoms1.forEach((atom) => (atom.isAromatic = true));
    isAromatic && bonds1.forEach((bond) => (bond.bondOrder = avgBondOrder));

    console.log(atoms1);
    console.log(bonds1);

    // const atomsAr = updateArAtoms(atomsTable, bondsTable);
    const startAtom = pickStartAtom(atoms1, bonds1);
    const chain = getUnbCyclicChain(atoms1, startAtom, bonds1);

    let priorityChain = pickChainDirection(chain);
    const lastInd = priorityChain.length - 2;

    priorityChain[0].disconnected = true;
    priorityChain[0].disconnectionType = "ring";
    priorityChain[0].disconnectedFrom = priorityChain[lastInd].id;

    priorityChain[lastInd].disconnected = true;
    priorityChain[lastInd].disconnectionType = "ring";
    priorityChain[lastInd].disconnectedFrom = priorityChain[0].id;

    console.log("priority chain: ");
    console.log(priorityChain);

    const arrayedSMILES = generateArrayedSMILES(priorityChain, bonds1);
    const numRingDisconnections = arrayedSMILES.filter(
      (el) => el.disconnectionType === "ring"
    ).length;

    for (let i = 0; i < numRingDisconnections / 2; i++) {
      const firstInd = arrayedSMILES.findIndex(
        (el) => el.disconnectionType === "ring"
      );
      const { disconnectedFrom } = arrayedSMILES.find(
        (el) => el.disconnectionType === "ring"
      );

      const secondInd = arrayedSMILES.findIndex(
        (el) => el.originID === disconnectedFrom
      );

      arrayedSMILES.splice(firstInd, 1, i + 1);
      arrayedSMILES.splice(secondInd, 1, i + 1);
    }

    const SMILES = arrayedSMILES.join("");
    console.log(SMILES);
  }

  // if too many branch points, quit SMILES generation
  if (branchPoints.length > 5) {
    alert("more than three branch points...quitting SMILES generation");
    return;
  }

  //========================================================================================//
  //========================================================================================//

  if (chainType === "branched") {
    console.log("analyzing branch points...");
    const branchPointTable = [];
    // const atoms1 = copyArray(atoms0);
    // const bonds1 = copyArray(bonds0);

    branchPoints.forEach((branchPoint) => {
      console.log(`analyzing branch point ${branchPoint.id} `);
      const branches = getBranches(branchPoint, atoms, bonds);
      console.log(branches);
      consolidateRings(branches);
      console.log(branches);
      branchPointTable.push({
        branchPointID: branchPoint.id,
        branches: branches,
      });
    });
    console.log("branch point table: ");
    console.log(branchPointTable);
    // branchPointTable.forEach((bpInfo) =>
    //   findDisconnections(bpInfo, atoms1, bonds1)
    // );
  }

  //========================================================================================//
  //========================================================================================//

  return;
}

//======================= secondary functions =============================//

function calculateWeight(atom, bonds) {
  const { id, atomicNum, isotope } = atom;
  const numAttachedAtoms = getNumAttachedAtoms(id, bonds);
  const cumulativeBondOrder = sumBondOrders(id, bonds);

  const weight =
    atomicNum * 100000 +
    isotope * 100 +
    numAttachedAtoms * 10 +
    cumulativeBondOrder;
  return weight;
}

function checkAromaticity(atoms, bonds) {
  // checks if all ring atoms are carbon (sp2) or heterosatoms (sp2 / sp3)
  // checks if ring system has 4n + 2 pi electrons
  const sp2_or_heteroatom = [];
  let nonbondingElectrons = 0;
  let bondingElectrons = 0;

  console.log("checking for aromaticity");
  for (let i = 0; i < atoms.length; i++) {
    const atom = atoms[i];
    const { element, id } = atom;
    const isHeteroatom = checkHeteroatom(atom);
    const hybridization = classifyHybridization(atom, bonds);
    if (isHeteroatom)
      console.log(`${id} is an ${hybridization} hybridized heteroatom`);
    if (element === "carbon")
      console.log(`${id} is an ${hybridization} hybridized carbon`);
    if (element === "carbon" && hybridization === "sp2") {
      sp2_or_heteroatom.push(true);
    } else if (isHeteroatom && hybridization === "sp2") {
      sp2_or_heteroatom.push(true);
    } else if (isHeteroatom && hybridization === "sp3") {
      sp2_or_heteroatom.push(true);
      nonbondingElectrons = nonbondingElectrons + 2;
    } else sp2_or_heteroatom.push(false);
  }

  for (let j = 0; j < bonds.length; j++) {
    const bond = bonds[j];
    const { bondOrder } = bond;
    if (bondOrder === 2) bondingElectrons = bondingElectrons + 2;
  }
  const piElectrons = nonbondingElectrons + bondingElectrons;

  console.log(`nonbonding electrons ${nonbondingElectrons}`);
  console.log(`bonding electrons ${bondingElectrons}`);
  console.log(`pi electrons in aromatic system: ${piElectrons}`);

  const has4nplus2Electrons = piElectrons % 4 === 2;
  const allsp2_or_heteroatoms = sp2_or_heteroatom.every((el) => el);

  const isAromatic = has4nplus2Electrons && allsp2_or_heteroatoms;
  if (isAromatic) console.log("the molecule is aromatic");
  if (!isAromatic) console.log("the molecule is not aromatic");
  return { isAromatic: isAromatic, piElectrons: piElectrons };
}

function checkHeteroatom(atom) {
  switch (atom.element) {
    case "oxygen":
    case "sulfur":
    case "nitrogen":
    case "phosphorus":
      return true;
    default:
      return false;
  }
}

function chooseNextAtomID(visitedAtoms, currentAtomID, bonds) {
  const attachedBonds = getAttachedBonds(currentAtomID, bonds);
  const candidateAtomIDs = attachedBonds.map((el) =>
    el.atom1_id === currentAtomID ? el.atom2_id : el.atom1_id
  );
  const candidateAtom1_ID = candidateAtomIDs[0];
  const candidateAtom2_ID = candidateAtomIDs[1];

  if (!visitedAtoms.includes(candidateAtom1_ID)) return candidateAtom1_ID;
  if (!visitedAtoms.includes(candidateAtom2_ID)) return candidateAtom2_ID;
  // if (visitedAtoms.length > 2 && visitedAtoms[0] === candidateAtom1_ID)
  //   return "ring detected";
  // if (visitedAtoms.length > 2 && visitedAtoms[0] === candidateAtom2_ID)
  //   return "ring detected";
  else return null;
}

function classifyChainType(terminalAtoms, branchPoints) {
  const unbranched = branchPoints.length === 0;
  const branched = branchPoints.length > 0;
  // const branched = branchPoints.length > 0;
  const cyclic = terminalAtoms.length === 0;
  const linear = terminalAtoms.length === 2;

  if (unbranched && cyclic) return "unbranched cyclic";
  if (unbranched && linear) return "unbranched linear";
  if (branched) return "branched";
}

function classifyHybridization(atom, bonds) {
  const attachedBonds = getAttachedBonds(atom.id, bonds);
  const numBonds = attachedBonds.length;
  const doubleBonds = attachedBonds.filter((el) => el.bondOrder === 2).length;
  const tripleBonds = attachedBonds.filter((el) => el.bondOrder === 3).length;
  if (numBonds <= 4 && doubleBonds === 0 && !tripleBonds) return "sp3";
  if (numBonds <= 4 && doubleBonds === 1 && !tripleBonds) return "sp2";
  if (numBonds <= 4 && doubleBonds === 2 && !tripleBonds) return "sp";
  if (numBonds <= 4 && !doubleBonds && tripleBonds === 1) return "sp";
  alert(`cannot classify hybridization of ${atom.id}`);
}

function consolidateRings(branches) {
  const numRings = branches.filter(
    (branch) => branch.endPointType === "ring"
  ).length;

  const numUniqueRings = numRings / 2;
  const visited = [];

  for (let i = 0; i < numUniqueRings; i++) {
    const ringA = branches.find(
      (branch) =>
        branch.endPointType === "ring" && !visited.includes(branch.branchIDs[1])
    );

    const ringB = branches.find(
      (branch) => branch.branchIDs[1] === ringA.branchIDs.at(-2)
    );

    const ring1b_index = branches.findIndex(
      (branch) => branch.branchIDs[1] === ringB.branchIDs[1]
    );

    visited.push(...ringA.branchIDs);

    console.log("consolidating rings...");
    console.log(ringA);
    console.log(ringB);

    branches.splice(ring1b_index, 1);
  }
}

function copyArray(arr) {
  const copiedArr = JSON.parse(JSON.stringify(arr));
  return copiedArr;
}

function extendAtoms(atoms, bonds) {
  const extendedAtomsTable = [];
  atoms.forEach((atom, index) => {
    extendedAtomsTable.push({
      id: atom.id,
      atomicNum: atom.atomicNum,
      element: atom.element,
      symbol: atom.symbol,
      isotope: atom.isotope,
      numAttachedAtoms: getNumAttachedAtoms(atom.id, bonds),
      weight: calculateWeight(atom, bonds),
    });
  });

  return extendedAtomsTable;
}

function findBond(atomIDs, bondsTable) {
  const [atom1_ID, atom2_ID] = atomIDs;

  const foundBond = bondsTable.find(
    (bond) =>
      (bond.atom1_id === atom1_ID && bond.atom2_id === atom2_ID) ||
      (bond.atom1_id === atom2_ID && bond.atom2_id === atom1_ID)
  );
  return foundBond;
}

// function findDisconnections(bpInfo, atoms, bonds) {
//   console.log(bpInfo);
//   console.log(atoms);
//   console.log(bonds);
// }

function generateArrayedSMILES(chainInfo, bondsTable) {
  console.log("generating arrayed SMILES...");
  console.log(chainInfo);

  const arrayedSMILES = [];
  for (let i = 0; i < chainInfo.length; i++) {
    const startAtom = chainInfo[0];
    const currentAtom = chainInfo[i];
    console.log(currentAtom);

    const { symbol, isAromatic, disconnected } = currentAtom;
    const { disconnectionType, disconnectedFrom } = currentAtom;
    const endOfCyclicChain = i > 0 && currentAtom.id === startAtom.id;

    if (endOfCyclicChain) return arrayedSMILES;

    if (isAromatic) arrayedSMILES.push(symbol.toLowerCase());
    if (!isAromatic) arrayedSMILES.push(symbol);

    if (disconnected)
      arrayedSMILES.push({
        originID: currentAtom.id,
        disconnectionType: disconnectionType,
        disconnectedFrom: disconnectedFrom,
      });

    const nextAtom = chainInfo[i + 1];
    if (!nextAtom) return arrayedSMILES;

    const nextAtomID = chainInfo[i + 1].id;

    const bond = findBond([currentAtom.id, nextAtomID], bondsTable);
    const bondSymbol = pickBondSymbol(bond);

    if (bondSymbol) arrayedSMILES.push(bondSymbol);
  }

  return arrayedSMILES;
}

function getAttachedBonds(atomID, bonds) {
  const attachedBonds = bonds.filter(
    (bond) => bond.atom1_id === atomID || bond.atom2_id === atomID
  );
  return attachedBonds;
}

function getAtomInfo(atoms, atomID) {
  const atomInfo = atoms.find((atom) => atom.id === atomID);
  return atomInfo;
}

function getBranch(branchPoint, attachedID, atoms, bonds) {
  const visitedAtoms = [branchPoint.id, attachedID];

  for (let i = 0; i < atoms.length; i++) {
    const currentAtomID = visitedAtoms.at(-1);
    const attachedBonds = getAttachedBonds(currentAtomID, bonds);
    const numAttachedAtoms = attachedBonds.length;
    const candidateAtomIDs = attachedBonds.map((el) =>
      el.atom1_id === currentAtomID ? el.atom2_id : el.atom1_id
    );

    const ringDetected =
      visitedAtoms.length > 2 && candidateAtomIDs.includes(branchPoint.id);

    if (ringDetected)
      return {
        branchIDs: [...visitedAtoms, branchPoint.id],
        endPointType: "ring",
      };

    //leave loop if terminal atom
    if (numAttachedAtoms === 1)
      return {
        branchIDs: visitedAtoms,
        endPointType: "terminal atom",
      };

    if (numAttachedAtoms > 2)
      return {
        branchIDs: visitedAtoms,
        endPointType: "branch point",
      };

    const nextAtomID = chooseNextAtomID(visitedAtoms, currentAtomID, bonds);
    nextAtomID && visitedAtoms.push(nextAtomID);
  }
}

function getBranches(branchPoint, atoms, bonds) {
  // step 1: find atoms attached to branch point

  const attachedBonds = getAttachedBonds(branchPoint.id, bonds);

  const attachedAtoms = [];
  attachedBonds.forEach((el) =>
    el.atom1_id === branchPoint.id
      ? attachedAtoms.push(el.atom2_id)
      : attachedAtoms.push(el.atom1_id)
  );

  const branches = attachedAtoms.map((attachedID) =>
    getBranch(branchPoint, attachedID, atoms, bonds)
  );
  return branches;
}

function getUnbLinearChain(atomsTable, startAtom, bondsTable) {
  console.log(startAtom);
  const startAtomID = startAtom.id;
  const chainIDs = [startAtomID];

  for (let i = 0; i < atomsTable.length - 1; i++) {
    let currentAtomID = chainIDs.at(-1);
    console.log(`analyzing ${currentAtomID}...`);

    const nextAtomID = chooseNextAtomID(chainIDs, currentAtomID, bondsTable);
    chainIDs.push(nextAtomID);
  }

  const chain = getChainInfo(chainIDs, atomsTable);

  return chain;
}

function getUnbCyclicChain(atomsTable, startAtom, bondsTable) {
  const startAtomID = startAtom.id;
  const chainIDs = [startAtomID];
  const attachedBonds = getAttachedBonds(startAtomID, bondsTable);
  const [attached1_ID, attached2_ID] = attachedBonds.map((attachedBond) =>
    attachedBond.atom1_id === startAtom.id
      ? attachedBond.atom2_id
      : attachedBond.atom1_id
  );
  const [attached1_BO, attached2_BO] = attachedBonds.map(
    (attachedBond) => attachedBond.bondOrder
  );

  if (attached1_BO > attached2_BO) chainIDs.push(attached1_ID);
  if (attached1_BO < attached2_BO) chainIDs.push(attached2_ID);

  for (let i = 0; i < atomsTable.length; i++) {
    let currentAtomID = chainIDs.at(-1);
    console.log(`analyzing ${currentAtomID}...`);

    const nextAtomID = chooseNextAtomID(chainIDs, currentAtomID, bondsTable);
    nextAtomID && chainIDs.push(nextAtomID);
  }
  const chain = getChainInfo(chainIDs, atomsTable);

  return [...chain, startAtom];
}

function getBranchPoints(numAttachedAtomsTable) {
  return numAttachedAtomsTable.filter((el) => el.numAttachedAtoms >= 3);
}

function getChainInfo(chainIDs, atoms) {
  const chainInfo = chainIDs.map((atomID) => getAtomInfo(atoms, atomID));
  return chainInfo;
}

function getNumAttachedAtoms(atomID, bonds) {
  const attachedBonds = bonds.filter(
    (bond) => bond.atom1_id === atomID || bond.atom2_id === atomID
  );
  return attachedBonds.length;
}

function getTerminalAtoms(numAttachedAtomsTable) {
  return numAttachedAtomsTable.filter((el) => el.numAttachedAtoms === 1);
}

function getWeights(atoms) {
  const weights = atoms.map((atom) => atom.weight);
  return weights;
}

function logAtoms(atoms) {
  console.log("atoms: ");
  console.log(atoms);
}

function logBonds(bonds) {
  console.log("bonds: ");
  console.log(bonds);
}

function logBranchPoints(branchPoints) {
  if (branchPoints.length === 0) {
    console.log("no branch points");
  } else if (branchPoints.length > 0) {
    console.log("branch points");
    console.log(branchPoints);
  }
}

function logChainType(chainType) {
  console.log(`The molecule is ${chainType}`);
}

function logTerminalAtoms(terminalAtoms) {
  if (terminalAtoms.length === 0) {
    console.log("no terminal atoms");
  } else if (terminalAtoms.length > 0) {
    console.log("terminal atoms:");
    console.log(terminalAtoms);
  }
}

function pickBondSymbol(bond) {
  const { bondOrder } = bond;
  switch (bondOrder) {
    case 2:
      return "=";
    case 3:
      return "#";
    default:
      return null;
  }
}

function pickChainDirection(chain) {
  const reverseChain = chain.slice().reverse();
  const midChain = (chain.length + 1) / 2;

  const chainWeights = chain.map((atom) => atom.weight);
  const reverseChainWeights = chainWeights.slice().reverse();

  const weightDeltas = [];
  for (let i = 0; i < chain.length; i++) {
    weightDeltas.push(chainWeights[i] - reverseChainWeights[i]);
  }

  const isSymmetrical = weightDeltas.every((el) => el === 0);
  if (isSymmetrical) console.log("the chain is symmetrical");
  if (isSymmetrical) return chain;

  const firstDelta = weightDeltas.find((el) => el !== 0);
  const indexOfDelta = weightDeltas.findIndex((el) => el !== 0);

  const indexOfPriorityAtom =
    firstDelta > 0 ? indexOfDelta : chain.length - 1 - indexOfDelta;

  const priorityChain =
    indexOfPriorityAtom + 1 <= midChain ? chain : reverseChain;

  return priorityChain;
}

function pickStartAtom(atoms, bondsTable) {
  const weights = getWeights(atoms);
  const allEqualWeights = weights.every((weight) => weight === weights[0]);

  // no priority atoms (all atoms of equal weight)
  if (allEqualWeights) console.log("all atoms have equal weight");
  if (allEqualWeights) return atoms[0];

  const maxWeight = Math.max(...weights);
  const maxWeightAtoms = atoms.filter((atom) => atom.weight === maxWeight);
  const numMaxWeightAtoms = maxWeightAtoms.length;

  // one priority atom
  if (numMaxWeightAtoms === 1) return maxWeightAtoms[0];

  // multiple priority atoms

  const chains = maxWeightAtoms.map((atom) =>
    getUnbCyclicChain(atoms, atom, bondsTable)
  );
  let priorityChains = chains.map((chain) => pickChainDirection(chain));
  const weightMatrix = [];

  for (let i = 0; i < priorityChains.length; i++) {
    const weightArray = priorityChains[i].map((atom) => atom.weight);
    weightMatrix.push(weightArray);
  }
  console.log(priorityChains);
  console.log(weightMatrix);

  for (let j = 0; j < atoms.length; j++) {
    const weights = [];
    priorityChains.forEach((chain) => weights.push(chain[j].weight));
    console.log(weights);

    const maxWeight = Math.max(...weights);
    console.log(maxWeight);

    priorityChains = priorityChains.filter(
      (chain) => chain[j].weight === maxWeight
    );
    if (priorityChains.length === 1) return priorityChains[0][0];

    if (priorityChains.length > 0 && j === atoms.length - 1)
      return priorityChains[0][0];
  }
  //still need to address symmetrical cases like dioxane
  alert("error in pickStartAtom function");
}

function removeBondsToHydrogen(atoms, bonds) {
  const hydrogens = atoms.filter((atom) => atom.element === "hydrogen");
  const hydrogenIDs = hydrogens.map((hydrogen) => hydrogen.id);

  const bonds_H_removed = bonds.filter(
    (bond) =>
      !hydrogenIDs.includes(bond.atom1_id) &&
      !hydrogenIDs.includes(bond.atom2_id)
  );

  return bonds_H_removed;
}

function removeHydrogens(atoms) {
  const atoms_H_removed = atoms.filter((atom) => atom.element !== "hydrogen");
  return atoms_H_removed;
}

function sumBondOrders(atomID, bonds) {
  const attachedBonds = getAttachedBonds(atomID, bonds);
  const bondOrders = attachedBonds.map((el) => el.bondOrder);
  const cumulativeBondOrders = sumArrayElements(bondOrders);

  return cumulativeBondOrders;
}

function sumArrayElements(arr) {
  const sum = arr.reduce((acc, cur) => acc + cur);
  return sum;
}
