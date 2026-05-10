# Class Diagram for Login Functionality

This document contains the class diagram for the authentication and login system of Catwalk Studio, modeled using Mermaid.

## Overview

The login system is built around React Context for state management and Supabase for backend authentication and data persistence.

```mermaid
classDiagram
    class AuthProvider {
        <<Component>>
        -user: Object
        -profile: Object
        -loading: boolean
        -initialized: boolean
        +signUp(email, password)
        +signIn(email, password)
        +signOut()
        +signInWithGoogle()
        +signInAsGuest()
        +refreshProfile()
        +updateProfile(updates)
        -fetchProfile(userId)
        -createRegisteredProfile(userId, email)
        -createGuestProfile(userId)
    }

    class AuthContext {
        <<Context>>
        +user: Object
        +profile: Object
        +loading: boolean
        +initialized: boolean
        +isAnonymous: boolean
        +creditBalance: number
        +signIn()
        +signUp()
        +signOut()
        +signInWithGoogle()
        +signInAsGuest()
    }

    class SupabaseClient {
        <<Service>>
        +auth.signInWithPassword()
        +auth.signUp()
        +auth.signOut()
        +auth.signInWithOAuth()
        +auth.signInAnonymously()
        +auth.onAuthStateChange()
        +from(table)
    }

    class UserRepository {
        <<Repository>>
        -tableName: String
        +findById(id): Promise~User~
        +save(user): Promise~void~
        +create(userData): Promise~User~
        +updateProfile(userId, updates): Promise~void~
        +findByEmail(email): Promise~User~
    }

    class IUserRepository {
        <<Interface>>
        +findById(id)*
        +save(user)*
        +create(userData)*
        +updateProfile(userId, updates)*
        +findByEmail(email)*
    }

    class User {
        <<Entity>>
        +user_id: String
        +email: String
        +user_type: String
        +full_name: String
        +avatar_url: String
        +credits_balance: Number
        +is_guest: Boolean
        +create(data): User
    }

    class UserMapper {
        <<Mapper>>
        +toDomain(data): User
        +toDatabase(user): Object
    }

    AuthProvider ..> AuthContext : provides
    AuthProvider --> SupabaseClient : uses for Auth & DB
    UserRepository --|> IUserRepository : implements
    UserRepository --> SupabaseClient : uses for DB
    UserRepository --> UserMapper : uses
    UserMapper --> User : creates
    AuthProvider ..> User : manages profile (Domain Entity)
```

## Key Components

1.  **AuthProvider**: The main React component that manages the authentication state. It listens to Supabase auth events and synchronizes the user profile from the database.
2.  **AuthContext**: Provides the authentication state and methods to the rest of the application via the `useAuth` hook.
3.  **SupabaseClient**: The external service interface used for both authentication (OAuth, Email/Password, Anonymous) and database operations.
4.  **UserRepository**: Encapsulates the logic for accessing user profile data in the Supabase `users` table.
5.  **User (Domain Entity)**: Represents the user within the application's domain logic, ensuring data consistency and validation.
6.  **UserMapper**: Handles the conversion between the database representation (JSON/Table row) and the domain representation (User class).
