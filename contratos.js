import { db, storage } from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";


const numeroContrato = document.getElementById("numeroContrato");
const proveedor = document.getElementById("proveedor");
const fechaVencimiento = document.getElementById("fechaVencimiento");
const area = document.getElementById("area");
const estado = document.getElementById("estado");
const observaciones = document.getElementById("observaciones");
const tipoContrato = document.getElementById("tipoContrato");

const tabla = document.getElementById("tabla");


export async function agregarActualizacion() {
  if (!contratoSeleccionadoId) {
    alert("No hay contrato seleccionado");
    return;
  }

  const texto = nuevaActualizacion.value.trim();
  if (!texto) return;

  await addDoc(
    collection(db, "contratos", contratoSeleccionadoId, "actualizaciones"),
    {
      texto,
      fecha: serverTimestamp()
    }
  );

  nuevaActualizacion.value = "";
  cargarActualizaciones();
}


let contratoSeleccionadoId = null;

// ==============================
// CREAR
// ==============================
export async function guardarContrato() {
  await addDoc(collection(db,"contratos"),{
    numeroContrato: numeroContrato.value,
    proveedor: proveedor.value,
    area: area.value,
    tipoContrato: tipoContrato.value,
    fechaVencimiento: fechaVencimiento.value,
    estado: estado.value,
    observaciones: observaciones.value || "",
    createdAt: serverTimestamp()
  });

  cargarContratos();
}


// ==============================
// LISTAR
// ==============================
export async function cargarContratos() {
  tabla.innerHTML = "";
  const snap = await getDocs(collection(db,"contratos"));

  snap.forEach(d => {
    const c = d.data();

    const tr = document.createElement("tr");
    tr.dataset.id = d.id;

    // 📅 cálculo de fechas
    const hoy = new Date();
    hoy.setHours(0,0,0,0);

    const vencimiento = new Date(c.fechaVencimiento);
    vencimiento.setHours(0,0,0,0);

    const diffDias = Math.ceil(
      (vencimiento - hoy) / (1000 * 60 * 60 * 24)
    );

    // 🎨 color de fila
    if (diffDias < 0) {
      tr.classList.add("vencido");
    } else if (diffDias <= 30) {
      tr.classList.add("por-vencer");
    }

    // 🔤 TEXTO DEL ESTADO (ACÁ VA LO QUE PREGUNTASTE)
    let estadoVisual = c.estado;

    if (diffDias < 0) {
      estadoVisual += " (Vencido)";
    } else if (diffDias <= 30) {
      estadoVisual += " (Por vencer)";
    }

    // 🧱 HTML DE LA FILA (ACÁ VA <td>${estadoVisual}</td>)
    tr.innerHTML = `
      <td>${c.numeroContrato}</td>
      <td>${c.proveedor}</td>
      <td>${c.area || "-"}</td>
      <td>${c.tipoContrato || "-"}</td>
      <td>${vencimiento.toLocaleDateString()}</td>
      <td>${estadoVisual}</td>
      <td>${c.observaciones || "-"}</td>
    `;

    tr.onclick = () => abrirModalEdicion(d.id);
    tabla.appendChild(tr);
  });
}


// ==============================
// ABRIR MODAL CON DATOS
// ==============================
async function abrirModalEdicion(id){
  contratoSeleccionadoId = id;
  cargarActualizaciones();

  const snap = await getDoc(doc(db,"contratos",id));
  const c = snap.data();

  editEstado.value = c.estado;
  editObservaciones.value = c.observaciones || "";

  modalEditar.classList.add("activo");
  cargarAdjuntos();

}

// ==============================
// GUARDAR EDICIÓN
// ==============================
export async function guardarEdicion(){
  if(!contratoSeleccionadoId){
    alert("No hay contrato seleccionado");
    return;
  }

  await updateDoc(
    doc(db,"contratos",contratoSeleccionadoId),
    {
      estado: editEstado.value,
      observaciones: editObservaciones.value
    }
  );

  modalEditar.classList.remove("activo");
  cargarContratos();
}

export async function cargarActualizaciones() {
  listaActualizaciones.innerHTML = "";

  const snap = await getDocs(
    collection(db, "contratos", contratoSeleccionadoId, "actualizaciones")
  );

  snap.forEach(d => {
    const a = d.data();

    listaActualizaciones.innerHTML += `
      <div class="actualizacion">
        📝 ${a.texto}
      </div>
    `;
  });
}

export async function subirAdjunto() {
  if (!contratoSeleccionadoId) {
    alert("No hay contrato seleccionado");
    return;
  }

  const file = archivoAdjunto.files[0];
  if (!file) {
    alert("Seleccioná un archivo");
    return;
  }

  // 📤 Subir a Storage
  const storageRef = ref(
    storage,
    `contratos/${contratoSeleccionadoId}/${Date.now()}_${file.name}`
  );

  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  // 🗂 Guardar referencia en Firestore
  await addDoc(
    collection(db, "contratos", contratoSeleccionadoId, "adjuntos"),
    {
      nombre: file.name,
      url,
      fecha: serverTimestamp()
    }
  );

  archivoAdjunto.value = "";
  cargarAdjuntos();
}

export async function cargarAdjuntos() {
  listaArchivos.innerHTML = "";

  const snap = await getDocs(
    collection(db, "contratos", contratoSeleccionadoId, "adjuntos")
  );

  snap.forEach(d => {
    const a = d.data();

    listaArchivos.innerHTML += `
      <div class="archivo">
        📎 <a href="${a.url}" target="_blank">${a.nombre}</a>
      </div>
    `;
  });
}
