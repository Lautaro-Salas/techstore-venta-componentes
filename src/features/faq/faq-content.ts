export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqCategory {
  id: string;
  title: string;
  items: FaqItem[];
}

/** Preguntas frecuentes generales de operación de la tienda (Argentina). */
export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: "compras",
    title: "Compras",
    items: [
      {
        question: "¿Cómo hago una compra?",
        answer:
          "Elegí los productos, agregalos al carrito y hacé clic en “Iniciar compra”. En el checkout completás tus datos de contacto, la dirección de entrega o el retiro en local, el método de envío y el medio de pago. Al confirmar, recibís un email con el número de pedido.",
      },
      {
        question: "¿Los precios incluyen IVA?",
        answer:
          "Sí. Todos los precios están expresados en pesos argentinos (ARS) con IVA incluido. Cuando corresponde, también mostramos el precio sin impuestos nacionales como referencia.",
      },
      {
        question: "¿El stock publicado es real?",
        answer:
          "Sí. El stock se actualiza con cada venta. El producto queda reservado una vez confirmado el pedido; si se agotara mientras lo tenés en el carrito, te avisamos antes de pagar.",
      },
      {
        question: "¿Puedo modificar o cancelar un pedido?",
        answer:
          "Si el pedido todavía no fue despachado o preparado para retiro, escribinos desde la página de contacto con tu número de orden y te ayudamos a modificarlo o cancelarlo.",
      },
    ],
  },
  {
    id: "pagos",
    title: "Pagos",
    items: [
      {
        question: "¿Qué medios de pago aceptan?",
        answer:
          "Los medios disponibles se muestran en el checkout. Habitualmente incluyen transferencia bancaria, Mercado Pago (tarjetas de crédito, débito y dinero en cuenta) y, en algunos casos, efectivo al retirar en el local.",
      },
      {
        question: "¿Hay descuento por transferencia?",
        answer:
          "Sí, cuando está vigente, el precio con descuento por transferencia se muestra en cada producto y en el resumen del checkout. Una vez confirmado el pedido te enviamos los datos bancarios para realizar el pago.",
      },
      {
        question: "¿Puedo pagar en cuotas?",
        answer:
          "Podés pagar en cuotas con tarjeta de crédito a través de Mercado Pago cuando haya planes disponibles. La cantidad de cuotas, el interés y el costo financiero total (CFT) se informan antes de confirmar el pago.",
      },
      {
        question: "¿Emiten Factura A o B?",
        answer:
          "Emitimos factura electrónica en todas las compras. Si sos responsable inscripto, indicá tu CUIT y razón social en el checkout para recibir Factura A; en el resto de los casos se emite Factura B.",
      },
      {
        question: "¿Es seguro pagar en el sitio?",
        answer:
          "Sí. Los pagos con tarjeta se procesan en la plataforma de Mercado Pago; la tienda no almacena los datos de tu tarjeta.",
      },
    ],
  },
  {
    id: "envios",
    title: "Envíos",
    items: [
      {
        question: "¿Hacen envíos a todo el país?",
        answer:
          "Sí, enviamos a domicilio a todo el país. En el checkout, al ingresar tu código postal, vas a ver las opciones disponibles para tu zona con su costo y plazo estimado.",
      },
      {
        question: "¿Qué diferencia hay entre envío estándar y express?",
        answer:
          "El envío estándar es la opción más económica. El envío express, disponible en algunas zonas, tiene un plazo de entrega menor. Los plazos se cuentan en días hábiles desde la acreditación del pago.",
      },
      {
        question: "¿Puedo retirar en el local?",
        answer:
          "Sí, cuando la opción de retiro en local está habilitada aparece en el checkout sin costo de envío. Te avisamos por email cuando tu pedido esté listo; para retirarlo, presentá tu DNI y el número de pedido.",
      },
      {
        question: "¿Cómo hago el seguimiento de mi envío?",
        answer:
          "Cuando despachamos el pedido te enviamos el número de seguimiento por email. También podés ver el estado del pedido desde tu cuenta.",
      },
      {
        question: "¿Hay envío gratis?",
        answer:
          "Cuando hay una promoción de envío gratis vigente, el monto mínimo y las zonas alcanzadas se muestran en el carrito y en el checkout.",
      },
    ],
  },
  {
    id: "garantias",
    title: "Garantías",
    items: [
      {
        question: "¿Los productos tienen garantía?",
        answer:
          "Sí. Todos los productos son nuevos, originales y cuentan con garantía oficial. El plazo de garantía de cada producto se indica en su ficha.",
      },
      {
        question: "¿Cómo hago un reclamo de garantía?",
        answer:
          "Escribinos desde la página de contacto eligiendo el motivo “Garantía”. Incluí tu número de pedido, el producto y una descripción de la falla. Te indicamos los pasos a seguir, que pueden incluir la gestión con nosotros o directamente con el servicio técnico oficial de la marca.",
      },
      {
        question: "¿Qué no cubre la garantía?",
        answer:
          "En general, la garantía no cubre daños por mal uso, golpes, humedad, instalación incorrecta, sobretensión o intervención de terceros no autorizados. Las condiciones completas están en la política de garantía.",
      },
    ],
  },
  {
    id: "devoluciones",
    title: "Devoluciones",
    items: [
      {
        question: "¿Puedo arrepentirme de una compra online?",
        answer:
          "Sí. Según la Ley 24.240 de Defensa del Consumidor, en las compras a distancia tenés derecho a revocar la aceptación dentro de los 10 días corridos desde que recibiste el producto o se celebró el contrato, lo último que ocurra. Podés iniciarlo desde el botón de arrepentimiento o desde la página de contacto.",
      },
      {
        question: "¿En qué estado tiene que estar el producto?",
        answer:
          "Para el arrepentimiento, el producto debe devolverse en las mismas condiciones en que lo recibiste, con sus accesorios, manuales y embalaje original.",
      },
      {
        question: "¿Cómo me devuelven el dinero?",
        answer:
          "Una vez recibido y revisado el producto, el reintegro se realiza por el mismo medio de pago utilizado en la compra. Los plazos de acreditación dependen de cada medio de pago.",
      },
      {
        question: "¿Puedo cambiar un producto?",
        answer:
          "Sí, podés solicitar un cambio escribiéndonos con tu número de pedido. Las condiciones están detalladas en la política de cambios.",
      },
    ],
  },
  {
    id: "productos",
    title: "Productos",
    items: [
      {
        question: "¿Los productos son nuevos y originales?",
        answer:
          "Sí. Vendemos únicamente productos nuevos, en su caja original sellada y con garantía oficial.",
      },
      {
        question: "¿Cómo sé si un componente es compatible con mi PC?",
        answer:
          "Revisá las especificaciones de la ficha de cada producto (socket, tipo de memoria, formato, consumo, conexiones). Si tenés dudas, escribinos con el detalle de tu equipo y te asesoramos antes de comprar.",
      },
      {
        question: "¿Las imágenes son exactamente iguales al producto?",
        answer:
          "Las imágenes son ilustrativas. Las características que valen son las indicadas en las especificaciones del producto.",
      },
    ],
  },
  {
    id: "cuenta",
    title: "Cuenta",
    items: [
      {
        question: "¿Necesito registrarme para comprar?",
        answer:
          "No es obligatorio, pero con una cuenta podés seguir tus pedidos, guardar direcciones, armar tu lista de favoritos y comprar más rápido.",
      },
      {
        question: "¿Cómo creo una cuenta?",
        answer:
          "Ingresá a “Crear cuenta”, completá tu nombre, email y una contraseña. Desde tu cuenta vas a poder ver tus pedidos y actualizar tus datos.",
      },
      {
        question: "Olvidé mi contraseña, ¿qué hago?",
        answer:
          "Desde la pantalla de ingreso elegí la opción para recuperar la contraseña y seguí las instrucciones que te enviamos por email. Si no lo recibís, revisá la carpeta de spam o escribinos.",
      },
    ],
  },
];
