import { protegerPagina, logout } from "./auth.js";
import {
  cargarContratos,
  guardarContrato,
  guardarEdicion,
  agregarActualizacion,
  subirAdjunto
} from "./contratos.js";

// proteger acceso
protegerPagina();

// eventos UI
btnLogout.onclick = logout;

// guardar contrato
btnGuardar.onclick = () => {
  guardarContrato();
};

// carga inicial
cargarContratos();

// guardar edición
btnGuardarEdicion.onclick = () => {
  guardarEdicion();
};

// cerrar modal
btnCerrarModal.onclick = () => {
  modalEditar.classList.remove("activo");
};

// agregar actualización
btnAgregarActualizacion.onclick = () => {
  agregarActualizacion();
};

// subir archivo adjunto
btnSubirArchivo.onclick = () => {
  subirAdjunto();
};


