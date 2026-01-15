import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
} from "firebase/firestore";
import { app } from "../firebase";

const auth = getAuth(app);
const db = getFirestore(app);

async function getEmailFromUsername(usernameInput) {
  try {
    const usernameLower = usernameInput.toLowerCase();
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("usernameLower", "==", usernameLower));

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return userDoc.data().email;
    }
    return null;
  } catch (err) {
    // If permission error, return null (can't check username)
    console.warn("Could not check username:", err);
    return null;
  }
}

export default function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [input, setInput] = useState(""); // email or username input
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // If already logged in, redirect to /user
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) navigate("/user");
    });
    return unsubscribe;
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      if (isLogin) {
        // LOGIN flow: try lookup email from username first
        let emailToUse = input;
        if (!input.includes("@")) {
          // looks like username, try to get email from Firestore
          const emailFromUsername = await getEmailFromUsername(input);
          if (!emailFromUsername) {
            setError("Username not found.");
            return;
          }
          emailToUse = emailFromUsername;
        }

        await signInWithEmailAndPassword(auth, emailToUse, password);
        navigate("/user");
      } else {
        // SIGNUP flow
        if (!username.trim()) {
          setError("Please enter a username.");
          return;
        }
        
        const trimmedUsername = username.trim();
        if (trimmedUsername.length < 3) {
          setError("Username must be at least 3 characters.");
          return;
        }
        if (trimmedUsername.length > 20) {
          setError("Username must be 20 characters or less.");
          return;
        }
        // Check username format (letters, numbers, underscores only)
        if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
          setError("Username can only contain letters, numbers, and underscores.");
          return;
        }
        
        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          return;
        }

        // Try to check duplicate username (case-insensitive) - but don't fail if permission error
        let usernameExists = false;
        try {
          const usernameLower = trimmedUsername.toLowerCase();
          const emailFromUsername = await getEmailFromUsername(usernameLower);
          usernameExists = !!emailFromUsername;
        } catch (err) {
          console.warn("Could not check username duplicate:", err);
          // Continue anyway - will be checked after account creation
        }

        if (usernameExists) {
          setError("Username already taken.");
          return;
        }

        // Try to check duplicate email - but don't fail if permission error
        let emailExists = false;
        try {
          const usersRef = collection(db, "users");
          const emailQuery = query(usersRef, where("email", "==", input));
          const emailSnapshot = await getDocs(emailQuery);
          emailExists = !emailSnapshot.empty;
        } catch (err) {
          console.warn("Could not check email duplicate:", err);
          // Continue anyway - Firebase Auth will handle duplicate emails
        }

        if (emailExists) {
          setError("Email already in use.");
          return;
        }

        // Create user with email and password
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          input,
          password
        );

        // Save username and email in Firestore
        // Check for duplicate username one more time after auth (now we have permissions)
        try {
          const usernameLower = trimmedUsername.toLowerCase();
          const emailFromUsername = await getEmailFromUsername(usernameLower);
          if (emailFromUsername && emailFromUsername !== input) {
            // Username already taken by another user, delete the account
            await userCredential.user.delete();
            setError("Username already taken.");
            return;
          }
        } catch (err) {
          console.warn("Could not verify username after signup:", err);
        }

        try {
          await setDoc(doc(db, "users", userCredential.user.uid), {
            username: trimmedUsername,
            usernameLower: trimmedUsername.toLowerCase(),
            email: input,
          });
        } catch (err) {
          console.error("Error saving user data:", err);
          // Don't fail signup if we can't save to Firestore
        }

        navigate("/user");
      }
    } catch (err) {
      setError(err.message || "Error logging in or signing up");
    }
  }

  return (
    <div style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <div
        style={{
          maxWidth: 400,
          margin: "80px auto",
          backgroundColor: "#121212",
          color: "#eee",
          padding: "30px 40px",
          borderRadius: 12,
          boxShadow: "0 0 20px rgba(0,0,0,0.7)",
        }}
      >
        <h1 style={{ textAlign: "center", color: "#61dafb", marginBottom: 20 }}>
          NextAnime
        </h1>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <button
            onClick={() => setIsLogin(true)}
            style={{
              backgroundColor: isLogin ? "#61dafb" : "transparent",
              color: isLogin ? "#000" : "#61dafb",
              border: "1px solid #61dafb",
              padding: "8px 20px",
              borderRadius: 6,
              marginRight: 10,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            style={{
              backgroundColor: !isLogin ? "#61dafb" : "transparent",
              color: !isLogin ? "#000" : "#61dafb",
              border: "1px solid #61dafb",
              padding: "8px 20px",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label>{isLogin ? "Email or Username" : "Email"}</label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px",
              margin: "8px 0 16px",
              borderRadius: 6,
              border: "1px solid #444",
              backgroundColor: "#1e1e1e",
              color: "#eee",
            }}
          />

          {!isLogin && (
            <>
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  margin: "8px 0 16px",
                  borderRadius: 6,
                  border: "1px solid #444",
                  backgroundColor: "#1e1e1e",
                  color: "#eee",
                }}
              />
            </>
          )}

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px",
              margin: "8px 0 20px",
              borderRadius: 6,
              border: "1px solid #444",
              backgroundColor: "#1e1e1e",
              color: "#eee",
            }}
          />

          {!isLogin && (
            <>
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  margin: "8px 0 20px",
                  borderRadius: 6,
                  border: "1px solid #444",
                  backgroundColor: "#1e1e1e",
                  color: "#eee",
                }}
              />
            </>
          )}

          {error && (
            <p style={{ color: "tomato", marginTop: 10, fontWeight: "700" }}>{error}</p>
          )}

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "#61dafb",
              color: "#000",
              border: "none",
              borderRadius: 6,
              fontWeight: "bold",
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            {isLogin ? "Login" : "Sign Up"}
          </button>
        </form>
      </div>

      <button
        onClick={() => navigate("/")}
        title="Go back"
        style={{
          position: "fixed",
          top: 10,
          right: 10,
          backgroundColor: "#61dafb",
          border: "none",
          borderRadius: 6,
          padding: "8px 12px",
          cursor: "pointer",
          fontWeight: "700",
          color: "#333",
        }}
      >
        Back
      </button>
    </div>
  );
}
