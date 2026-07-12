import React, { useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";
import Colors from "../../theme/colors";

interface Props {
  placeholder: string;
  secure?: boolean;
  value: string;
  onChangeText: (v: string) => void;
}

export default function AppInput({
  placeholder,
  secure,
  value,
  onChangeText,
}: Props) {
  const [hide, setHide] = useState(secure);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        secureTextEntry={hide}
        value={value}
        onChangeText={onChangeText}
      />

      {secure && (
        <TouchableOpacity onPress={() => setHide(!hide)}>
          <Ionicons name={hide ? "eye-off" : "eye"} size={22} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 55,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginTop: 15,
  },

  input: {
    flex: 1,
    fontSize: 16,
  },
});
