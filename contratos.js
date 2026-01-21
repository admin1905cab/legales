import { auth, db, storage } from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const archivoAdjunto = document.getElementById("archivoAdjunto");
const listaArchivos = document.getElementById("listaArchivos");

const nuevaActualizacion = document.getElementById("nuevaActualizacion");
const listaActualizaciones = document.getElementById("listaActualizaciones");

const modalEditar = document.getElementById("modalEditar");
const editEstado = document.getElementById("editEstado");
const editObservaciones = document.getElementById("editObservaciones");

const numeroContrato = document.getElementById("numeroContrato");
const proveedor = document.getElementById("proveedor");
const fechaVencimiento = document.getElementById("fechaVencimiento");
const area = document.getElementById("area");
const estado = document.getElementById("estado");
const observaciones = document.getElementById("observaciones");
const tipoContrato = document.getElementById("tipoContrato");

const btnCerrarModal = document.getElementById("btnCerrarModal");

btnCerrarModal.addEventListener("click", cerrarModal);



const tabla = document.getElementById("tabla");

function obtenerPathDesdeURL(url) {
  const decoded = decodeURIComponent(url);
  const match = decoded.match(/\/o\/(.+)\?/);
  return match ? match[1] : null;
}


export async function agregarActualizacion() {
  if (!contratoSeleccionadoId) {
    alert("No hay contrato seleccionado");
    return;
  }

  const texto = nuevaActualizacion.value.trim();
  if (!texto) return;

  const user = auth.currentUser;

  await addDoc(
    collection(db, "contratos", contratoSeleccionadoId, "actualizaciones"),
    {
      texto,
      usuario: user?.displayName || user?.email || "Usuario desconocido",
      uid: user?.uid || null,
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

  // 🔥 limpiar formulario al guardar
  limpiarFormularioContrato();
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
      <button onclick="eliminarContrato(event, '${d.id}')">🗑</button>
    `;

    tr.onclick = () => abrirModalEdicion(d.id);
    tabla.appendChild(tr);
  });
}


// ==============================
// ABRIR MODAL CON DATOS
// ==============================
let modalAbierto = false;

async function abrirModalEdicion(id) {

  // 🛑 EVITA DOBLE EJECUCIÓN
  if (modalAbierto && contratoSeleccionadoId === id) return;

  modalAbierto = true;
  contratoSeleccionadoId = id;

  // 🧹 LIMPIAR SIEMPRE
  listaArchivos.innerHTML = "";
  listaActualizaciones.innerHTML = "";

  const snap = await getDoc(doc(db, "contratos", id));
  const c = snap.data();

  editEstado.value = c.estado;
  editObservaciones.value = c.observaciones || "";

  modalEditar.classList.add("activo");

  await cargarAdjuntos();
  await cargarActualizaciones();
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

  cerrarModal();

  cargarContratos();
}

export async function cargarActualizaciones() {
  listaActualizaciones.innerHTML = "";

  const snap = await getDocs(
    collection(db, "contratos", contratoSeleccionadoId, "actualizaciones")
  );

  snap.forEach(d => {
    const a = d.data();

    const fecha = a.fecha?.toDate
      ? a.fecha.toDate().toLocaleString("es-AR")
      : "";

    listaActualizaciones.innerHTML += `
      <div class="actualizacion">
        <div class="actualizacion-header">
          <strong>${a.usuario || "Sin usuario"}</strong>
          <span class="fecha">${fecha}</span>
        </div>
        <div class="actualizacion-texto">
          ${a.texto}
        </div>
      </div>
    `;
  });
}


export async function subirAdjunto() {
  if (!contratoSeleccionadoId) return;

  const file = archivoAdjunto.files[0];
  if (!file) return;

  const nombreArchivo = `${Date.now()}_${file.name}`;
  const path = `contratos/${contratoSeleccionadoId}/${nombreArchivo}`;

  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  await addDoc(
    collection(db, "contratos", contratoSeleccionadoId, "adjuntos"),
    {
      nombre: file.name,
      url,
      path, // 🔑 IMPORTANTE
      fecha: serverTimestamp(),
      usuario: auth.currentUser.email,
      uid: auth.currentUser.uid
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
      <button onclick="eliminarAdjunto('${d.id}', '${a.path || ""}', '${a.url}')">
      🗑
      </button>
    </div>
    `;

  });
}

window.eliminarContrato = async function (e, id) {
  e.stopPropagation(); // ⛔ evita que se dispare el click de la fila

  const confirmar = confirm("¿Seguro que querés eliminar este registro?");

  if (!confirmar) return;

  try {
    await deleteDoc(doc(db, "contratos", id));
    alert("Registro eliminado");
    cargarContratos();
  } catch (error) {
    console.error(error);
    alert("Error al eliminar");
  }
};

window.subirAdjunto = subirAdjunto;


window.eliminarAdjunto = async function (idAdjunto, path, url) {
  const confirmar = confirm("¿Eliminar este adjunto?");
  if (!confirmar) return;

  try {
    let filePath = path;

    // 🟡 Adjuntos viejos: obtener path desde la URL
    if (!filePath && url) {
      filePath = obtenerPathDesdeURL(url);
    }

    if (!filePath) {
      throw new Error("No se pudo determinar la ruta del archivo");
    }

    // 1️⃣ Eliminar de Storage
    const storageRef = ref(storage, filePath);
    await deleteObject(storageRef);

    // 2️⃣ Eliminar de Firestore
    await deleteDoc(
      doc(db, "contratos", contratoSeleccionadoId, "adjuntos", idAdjunto)
    );

    // 3️⃣ Refrescar lista
    cargarAdjuntos();

  } catch (error) {
    console.error("Error al eliminar adjunto:", error);
    alert("No se pudo eliminar el archivo");
  }
};

function cerrarModal() {
  modalEditar.classList.remove("activo");

  // 🔄 Reset de estado (CLAVE)
  contratoSeleccionadoId = null;
  modalAbierto = false;

  // 🧹 Limpieza visual
  listaArchivos.innerHTML = "";
  listaActualizaciones.innerHTML = "";
}

function limpiarFormularioContrato() {
  numeroContrato.value = "";
  proveedor.value = "";
  area.value = "";
  tipoContrato.value = "";
  fechaVencimiento.value = "";
  estado.value = "";
  observaciones.value = "";

  // limpiar adjuntos
  archivoAdjunto.value = "";

  // limpiar listas visuales
  listaArchivos.innerHTML = "";
  listaActualizaciones.innerHTML = "";
}