

export const createUser = async (req, res) => {
  try {
    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: req.body
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating user",
      error: error.message
    });
  }
};