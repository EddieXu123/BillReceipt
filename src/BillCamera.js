import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Camera } from "expo-camera";
import RNFS from "react-native-fs";

export const BillCamera = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  let cameraRef = null;

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  const takePicture = async () => {
    try {
      if (!cameraRef) return;
      const photo = await cameraRef.takePictureAsync();
      console.log(photo);
      const filePath = photo.uri;
      console.log("Heyo");

      const newFilePath = RNFS.DocumentDirectoryPath;
      console.log("HEYYYY");
      //   console.log(newFilePath);
      //   RFNS.moveFile(filePath, newFilePath)
      //     .then(() => {
      //       console.log("Image Moved");
      //     })
      //     .catch((error) => {
      //       console.log(error);
      //     });
      console.log("Finished");
      setPreviewVisible(true);
      setCapturedImage(photo);
      cameraRef.pausePreview();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        type={type}
        ref={(r) => {
          cameraRef = r;
        }}
      >
        <View style={styles.cameraContainer}>
          <TouchableOpacity onPress={takePicture}>
            <Text style={styles.text}> Take photo </Text>
          </TouchableOpacity>
        </View>
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraContainer: {
    width: 400,
    height: "80%",
  },
  text: {
    fontSize: 40,
  },
});
