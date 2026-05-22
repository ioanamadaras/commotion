# Diagrame licență - Commotion

Acest fișier conține diagramele recomandate pentru lucrarea de licență, generate pe baza aplicației existente.

## 1. Arhitectura generală

```mermaid
flowchart LR
    U[Utilizator] --> C[Client web React / Vite]
    C -->|HTTP REST| A[API Express]
    C <-->|WebSocket / Socket.io| S[Socket.io server]
    A --> M[(MongoDB)]
    S --> M

    subgraph Frontend
        C
    end

    subgraph Backend
        A
        S
    end
```

## 2. Diagrama use case

```mermaid
flowchart TB
    user[Utilizator autentificat]
    guest[Utilizator nou]

    uc1((Înregistrare))
    uc2((Autentificare))
    uc3((Vizualizare board-uri))
    uc4((Creare board))
    uc5((Deschidere board))
    uc6((Join board cu cheie))
    uc7((Editare board în timp real))
    uc8((Schimbare permisiuni))
    uc9((Ștergere board))
    uc10((Schimbare temă))

    guest --> uc1
    guest --> uc2
    user --> uc3
    user --> uc4
    user --> uc5
    user --> uc6
    user --> uc7
    user --> uc8
    user --> uc9
    user --> uc10
```

## 3. Model de date

```mermaid
erDiagram
    USER ||--o{ BOARD : owns
    USER ||--o{ BOARD : can_edit
    USER ||--o{ BOARD : can_view

    USER {
        string _id
        string username
        string email
        string password
    }

    BOARD {
        string _id
        string title
        string joinKey
        string owner
        string[] editorUsersIds
        string[] viewerUserIds
        object boardData
        date createdAt
        date updatedAt
    }
```

## 4. Diagramă de componente

```mermaid
flowchart LR
    subgraph Frontend[Client web]
        App[App / routing]
        AuthPages[Login / Register]
        HomePage[Home]
        BoardPage[Board canvas]
        Context[StateProvider]
        UI[Sidebar, modaluri, toast-uri]
        Api[API client]
        SocketClient[Socket client]
    end

    subgraph Backend[Server]
        UserRoutes[User routes]
        BoardRoutes[Board routes]
        Auth[Auth helper]
        SocketServer[Socket.io handlers]
        Models[User / Board models]
    end

    App --> AuthPages
    App --> HomePage
    App --> BoardPage
    App --> Context
    HomePage --> UI
    BoardPage --> UI
    BoardPage --> SocketClient
    AuthPages --> Api
    HomePage --> Api
    BoardPage --> Api
    Api --> UserRoutes
    Api --> BoardRoutes
    SocketClient --> SocketServer
    UserRoutes --> Auth
    BoardRoutes --> Auth
    UserRoutes --> Models
    BoardRoutes --> Models
    SocketServer --> Models
```

## 5. Secvență: înregistrare și autentificare

```mermaid
sequenceDiagram
    actor Utilizator
    participant UI as Client web
    participant API as Express API
    participant DB as MongoDB

    Utilizator->>UI: Introduce username, email, parola
    UI->>API: POST /user/register
    API->>DB: Verifică existența utilizatorului
    API->>DB: Creează user nou
    API-->>UI: token + profil user
    UI->>UI: Salvează tokenul și starea de autentificare

    Utilizator->>UI: Introduce email și parola
    UI->>API: PUT /user/login
    API->>DB: Caută userul
    API-->>UI: token + profil user
    UI->>UI: Salvează tokenul și redirecționează
```

## 6. Secvență: deschidere board și colaborare în timp real

```mermaid
sequenceDiagram
    actor Utilizator
    participant UI as Client web
    participant REST as API Express
    participant WS as Socket.io
    participant DB as MongoDB

    Utilizator->>UI: Deschide board-ul
    UI->>REST: GET /board/:boardId
    REST->>DB: Verifică accesul și încarcă board-ul
    REST-->>UI: board + permissionLevel

    UI->>WS: board:join(boardId, userId, username)
    WS->>DB: Verifică permisiunea
    WS-->>UI: Join room confirmat

    Utilizator->>UI: Modifică elementele pe canvas
    UI->>WS: board:update(elements, appState, files)
    WS->>DB: Salvează boardData
    WS-->>UI: board:update către ceilalți participanți

    Utilizator->>UI: Mișcă cursorul
    UI->>WS: cursor:update
    WS-->>UI: cursor:update către ceilalți utilizatori
```

## 7. Diagramă de activitate: gestionarea unui board

```mermaid
flowchart TD
    A[Utilizator autentificat] --> B{Are board-ul acces?}
    B -- Nu --> C[Primește eroare / redirecționare]
    B -- Da --> D[Încărcare board]
    D --> E{Permisiune de editare?}
    E -- Nu --> F[Mod vizualizare]
    E -- Da --> G[Mod editare]
    G --> H[Modificare canvas]
    H --> I[Transmitere update prin Socket.io]
    I --> J[Persistare în MongoDB]
    J --> G
    F --> K[Urmărire conținut și utilizatori online]
```

## Recomandare de folosire în lucrare

- Figura 1: Arhitectura generală a aplicației
- Figura 2: Cazuri de utilizare ale sistemului
- Figura 3: Modelul de date
- Figura 4: Diagrama de componente
- Figura 5: Secvența de înregistrare și autentificare
- Figura 6: Secvența de colaborare în timp real
- Figura 7: Fluxul de lucru pentru gestionarea unui board
