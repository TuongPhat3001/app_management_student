import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

const keyFor = (role: string, userKey: string) =>
  `avatar_uri_${role}_${userKey || "default"}`;

export async function loadAvatarUri(
  role: string,
  userKey: string,
): Promise<string | null> {
  try {
    return (await AsyncStorage.getItem(keyFor(role, userKey))) || null;
  } catch {
    return null;
  }
}

export async function saveAvatarUri(
  role: string,
  userKey: string,
  uri: string,
): Promise<void> {
  await AsyncStorage.setItem(keyFor(role, userKey), uri);
}

function imageMediaTypes(ImagePicker: any) {
  if (ImagePicker.MediaType?.Images != null) {
    return [ImagePicker.MediaType.Images];
  }
  if (ImagePicker.MediaType?.Image != null) {
    return [ImagePicker.MediaType.Image];
  }
  return ["images"];
}

export async function pickAvatarImage(): Promise<string | null> {
  let ImagePicker: any;
  try {
    ImagePicker = require("expo-image-picker");
  } catch {
    Alert.alert(
      "Thiếu thư viện",
      "Chạy lệnh:\nnpx expo install expo-image-picker\nrồi khởi động lại app.",
    );
    return null;
  }

  return new Promise((resolve) => {
    Alert.alert("Đổi ảnh đại diện", "Chọn nguồn ảnh", [
      {
        text: "Thư viện ảnh",
        onPress: async () => {
          try {
            const perm =
              await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!perm.granted) {
              Alert.alert(
                "Cần quyền",
                "Vui lòng cho phép truy cập thư viện ảnh.",
              );
              resolve(null);
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: imageMediaTypes(ImagePicker),
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (result.canceled || !result.assets?.[0]?.uri) {
              resolve(null);
              return;
            }
            resolve(result.assets[0].uri);
          } catch (e: any) {
            Alert.alert("Lỗi", e?.message || "Không chọn được ảnh");
            resolve(null);
          }
        },
      },
      {
        text: "Máy ảnh",
        onPress: async () => {
          try {
            const perm = await ImagePicker.requestCameraPermissionsAsync();
            if (!perm.granted) {
              Alert.alert("Cần quyền", "Vui lòng cho phép dùng máy ảnh.");
              resolve(null);
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (result.canceled || !result.assets?.[0]?.uri) {
              resolve(null);
              return;
            }
            resolve(result.assets[0].uri);
          } catch (e: any) {
            Alert.alert("Lỗi", e?.message || "Không chụp được ảnh");
            resolve(null);
          }
        },
      },
      { text: "Hủy", style: "cancel", onPress: () => resolve(null) },
    ]);
  });
}
