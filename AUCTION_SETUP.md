# OkBond Auction Setup Guide

## 🚀 Configuración para Crear Subastas desde el Frontend

Esta guía te ayudará a configurar y utilizar la funcionalidad de creación de subastas desde la aplicación web.

## 📋 Prerrequisitos

1. **MetaMask instalado** en tu navegador
2. **Contratos deployados** en la red que uses (testnet o mainnet)
3. **Tokens de prueba** para collateral y principal

## 🔧 Configuración Necesaria

### 1. Actualizar la dirección del AuctionFactory

En el archivo `/app/create-auction/page.tsx`, actualiza la dirección del contrato:

```typescript
// Línea 44 - Reemplaza con tu dirección del AuctionFactory deployado
const AUCTION_FACTORY_ADDRESS = "0x... tu dirección aquí ..."
```

### 2. Deploy de los Contratos

Si aún no has deployado los contratos, sigue estos pasos:

```bash
# En la carpeta OkBond
cd OkBond

# Compilar contratos
npx hardhat compile

# Deploy en red local
npx hardhat run scripts/deploy.js --network localhost

# O deploy en testnet (ej: Sepolia)
npx hardhat run scripts/deploy.js --network sepolia
```

### 3. Configuración del AuctionFactory

Después del deploy, necesitas configurar el AuctionFactory:

```javascript
// Script de configuración (crear en OkBond/scripts/setup-factory.js)
async function main() {
  const factoryAddress = "TU_FACTORY_ADDRESS";
  const factory = await ethers.getContractAt("AuctionFactory", factoryAddress);
  
  // Configurar tokens permitidos
  await factory.whitelistPrincipal("0x...USDC_ADDRESS");
  await factory.whitelistCollateral("0x...WETH_ADDRESS");
  
  // Configurar oráculos de precio
  await factory.setupCollateralOracle("0x...WETH_ADDRESS", "0x...ORACLE_ADDRESS");
  
  // Configurar tamaño de slot
  await factory.setAuctionSlot("0x...USDC_ADDRESS", ethers.parseUnits("100", 6)); // 100 USDC mínimo
  
  // Configurar tasas de interés permitidas (en BPS)
  await factory.setAllowedInterestRates([
    500,  // 5%
    750,  // 7.5%
    1000, // 10%
    1250, // 12.5%
    1500  // 15%
  ]);
}
```

## 📱 Uso de la Aplicación

### Paso 1: Conectar Wallet
1. Navega a la aplicación en `http://localhost:3000`
2. Haz clic en "Connect Wallet"
3. Autoriza la conexión con MetaMask

### Paso 2: Crear una Subasta
1. Haz clic en "Create Auction" en la página principal
2. Completa el formulario:
   - **Principal Goal**: Cantidad a pedir prestada (ej: 10000 USDC)
   - **Max Interest Rate**: Tasa máxima anual que aceptas (ej: 10%)
   - **Min Collateralization Ratio**: Ratio mínimo de colateral (ej: 150%)
   - **Initial Collateral**: Tu depósito inicial de colateral (ej: 5 ETH)
   - **Auction Duration**: Duración en épocas (1 época = 30 días)
   - **Loan Duration**: Duración del préstamo en épocas

### Paso 3: Aprobar y Crear
1. El sistema pedirá aprobar el token de colateral
2. Confirma la transacción en MetaMask
3. Luego se creará la subasta
4. Recibirás la dirección del contrato de subasta creado

## 🧪 Testing en Red Local

Para pruebas locales con Hardhat:

```bash
# Terminal 1 - Iniciar nodo local
npx hardhat node

# Terminal 2 - Deploy contratos
npx hardhat run scripts/deploy.js --network localhost

# Terminal 3 - Iniciar frontend
cd v0-web3-app-development
npm run dev
```

## 📊 Parámetros de Subasta Explicados

| Parámetro | Descripción | Ejemplo |
|-----------|-------------|---------|
| **Principal Goal** | Cantidad total a pedir prestada | 10,000 USDC |
| **Max Interest Rate** | Tasa anual máxima aceptable | 10% |
| **Min CR** | Ratio mínimo de colateralización | 150% |
| **Collateral Deposit** | Colateral inicial a depositar | 5 ETH |
| **Auction Duration** | Tiempo para recibir ofertas | 7 épocas (210 días) |
| **Loan Duration** | Duración total del préstamo | 12 épocas (360 días) |

## 🔍 Verificación de Transacciones

Después de crear una subasta, puedes verificar:

1. **En Etherscan/Testnet Explorer**: Usa la dirección del contrato devuelta
2. **En los logs**: La aplicación mostrará el evento `AuctionCreated`
3. **En el contrato Factory**: Llama a `getAllAuctions()` para ver todas las subastas

## ⚠️ Consideraciones Importantes

1. **Gas Fees**: Asegúrate de tener suficiente ETH para las transacciones
2. **Aprobaciones**: El colateral debe ser aprobado antes de crear la subasta
3. **Validaciones**: El Factory valida todos los parámetros antes de crear la subasta
4. **Tiempos**: La subasta debe comenzar al menos 1 semana en el futuro

## 🐛 Solución de Problemas

### Error: "Collateral token not allowed"
- El token de colateral no está en whitelist
- Solución: El owner debe llamar a `whitelistCollateral()`

### Error: "Principal token not allowed"
- El token principal no está en whitelist
- Solución: El owner debe llamar a `whitelistPrincipal()`

### Error: "Insufficient slot size"
- No se ha configurado el tamaño de slot para el token principal
- Solución: El owner debe llamar a `setAuctionSlot()`

### Error: "Min CR does not hold initially"
- El colateral inicial no cumple con el ratio mínimo
- Solución: Aumenta el depósito de colateral inicial

## 📚 Recursos Adicionales

- [Documentación de Hardhat](https://hardhat.org/docs)
- [ethers.js v6 Docs](https://docs.ethers.org/v6/)
- [MetaMask Docs](https://docs.metamask.io/)

## 🤝 Soporte

Si encuentras problemas o tienes preguntas:
1. Revisa los logs de la consola del navegador
2. Verifica las transacciones en el explorador de bloques
3. Asegúrate de que todos los contratos estén correctamente configurados

---

**Nota**: Recuerda actualizar las direcciones de los contratos y configuraciones según tu entorno de deployment. 